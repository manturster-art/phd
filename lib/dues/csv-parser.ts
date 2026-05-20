// =====================================================================
// lib/dues/csv-parser.ts
// 5개 은행 거래내역 CSV/XLSX 파싱.
// 백엔드 명세 (06_backend §5.2) 의 헤더 매핑표를 그대로 구현.
// 단위 테스트 친화: pure function (Papa.parse 결과 / XLSX.utils.sheet_to_json
// 결과를 받아서 표준 객체로 변환).
//
// xlsx 라이브러리 버전: 0.18.5 (CVE-2024-22363 영향)
//   - 결정 사유: SheetJS CDN 의 latest tarball(https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz)
//     이 본 환경에서 403 으로 접근 불가하여 npm 레지스트리의 마지막 OSS 버전(0.18.5) 핀.
//   - CVE 위험: ReDoS, prototype pollution. 본 모듈은 신뢰 가능한 임원 업로드만 처리하고
//     서버에서 메모리 처리 후 즉시 폐기. 외부 사용자가 직접 업로드 불가.
//   - 후속 조치: 사업자 인증 후 SheetJS Pro 또는 안전 mirror 로 교체 권장.
// =====================================================================

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { DuesSourceBank } from '@/lib/types/database';

export interface StandardTransaction {
  rawPayerName: string;
  rawMemo: string | null;
  rawAmountKrw: number;
  /** ISO datetime (KST 가정, fallback 으로 날짜만) */
  rawTransactionDate: string;
}

export interface ParseResult {
  detectedBank: DuesSourceBank;
  totalRows: number;
  rows: StandardTransaction[];
  /** 파싱 도중 스킵된 행의 라인번호 (1-indexed). */
  skippedLines: number[];
}

// 헤더 정규화 — 공백/괄호 제거 후 소문자화.
function normHeader(h: string): string {
  return (h ?? '').toString().replace(/\s+|\(|\)/g, '').toLowerCase();
}

export function detectBank(headers: string[]): DuesSourceBank {
  const norm = headers.map(normHeader);
  const has = (key: string) => norm.some((h) => h.includes(key.toLowerCase()));

  if (has('카카오') || has('kakaobank')) return 'kakaobank';
  if (norm.some((h) => h === '보낸분/받는분') || has('신한')) return 'shinhan';
  if (has('toss') || has('토스')) return 'toss';
  if (norm.includes('적요') && (has('국민') || has('kb'))) return 'kb';
  if (norm.includes('보낸분') && norm.includes('적요')) return 'woori';
  return 'unknown';
}

// 표준 필드명 ← 은행별 헤더 후보 (백엔드 명세 §5.2)
type FieldMap = {
  transactionDate: string[];
  payerName: string[];
  amount: string[];
  memo: string[];
};

const BANK_MAPS: Record<DuesSourceBank, FieldMap> = {
  kb: {
    transactionDate: ['거래일시', '거래일자'],
    payerName: ['적요', '보낸분'],
    amount: ['입금액(원)', '입금금액', '입금'],
    memo: ['메모', '내용'],
  },
  shinhan: {
    transactionDate: ['거래일자', '거래일시'],
    payerName: ['보낸분/받는분', '보낸분'],
    amount: ['입금금액', '입금액', '입금'],
    memo: ['내용', '적요', '메모'],
  },
  woori: {
    transactionDate: ['거래일시', '거래일자'],
    payerName: ['보낸분'],
    amount: ['입금', '입금금액'],
    memo: ['적요', '메모'],
  },
  kakaobank: {
    transactionDate: ['거래일시'],
    payerName: ['받는분/보낸분', '보낸분', '받는분'],
    amount: ['입금금액', '입금'],
    memo: ['메모', '내용'],
  },
  toss: {
    transactionDate: ['일시', '거래일시'],
    payerName: ['보낸분'],
    amount: ['입금', '입금금액'],
    memo: ['메모', '적요'],
  },
  unknown: {
    transactionDate: ['거래일시', '거래일자', '일시', '날짜'],
    payerName: ['보낸분', '입금자', '적요', '받는분'],
    amount: ['입금', '입금금액', '입금액', '입금액(원)'],
    memo: ['메모', '내용', '적요'],
  },
};

// 헤더 후보 중 매핑되는 컬럼 인덱스를 찾아 반환.
function findIndex(headers: string[], candidates: string[]): number {
  const normHeaders = headers.map(normHeader);
  for (const cand of candidates) {
    const target = normHeader(cand);
    const idx = normHeaders.findIndex((h) => h === target || h.includes(target));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseAmount(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number') return Math.round(raw);
  const s = String(raw).replace(/[^0-9.-]/g, '');
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

function parseTransactionDate(raw: unknown): string | null {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString();
  }
  const s = String(raw).trim();
  // YYYY.MM.DD / YYYY-MM-DD / YYYY/MM/DD (HH:MM(:SS))?
  const norm = s
    .replace(/\./g, '-')
    .replace(/\//g, '-')
    .replace(/\s+/, 'T');
  const d = new Date(norm);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  // fallback: 날짜만 YYYY-MM-DD
  const dateOnly = /(\d{4})-?(\d{2})-?(\d{2})/.exec(s);
  if (dateOnly) {
    return new Date(
      `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T00:00:00`
    ).toISOString();
  }
  return null;
}

// 2D 배열(헤더 + 데이터행) → 표준 거래 리스트.
export function transformRows(
  headerRow: string[],
  dataRows: unknown[][],
  bank: DuesSourceBank
): { rows: StandardTransaction[]; skippedLines: number[] } {
  const map = BANK_MAPS[bank];
  const iDate = findIndex(headerRow, map.transactionDate);
  const iPayer = findIndex(headerRow, map.payerName);
  const iAmount = findIndex(headerRow, map.amount);
  const iMemo = findIndex(headerRow, map.memo);

  const rows: StandardTransaction[] = [];
  const skippedLines: number[] = [];

  dataRows.forEach((row, idx) => {
    const lineNo = idx + 2; // 헤더가 1행
    const payer = iPayer >= 0 ? String(row[iPayer] ?? '').trim() : '';
    const amount = iAmount >= 0 ? parseAmount(row[iAmount]) : null;
    const dateIso = iDate >= 0 ? parseTransactionDate(row[iDate]) : null;
    const memo = iMemo >= 0 ? String(row[iMemo] ?? '').trim() : '';

    if (!payer || amount == null || amount <= 0 || !dateIso) {
      skippedLines.push(lineNo);
      return;
    }

    rows.push({
      rawPayerName: payer,
      rawMemo: memo || null,
      rawAmountKrw: amount,
      rawTransactionDate: dateIso,
    });
  });

  return { rows, skippedLines };
}

// CSV (UTF-8 가정. EUC-KR 대응은 P2) → ParseResult.
export function parseCsvText(text: string): ParseResult {
  const parsed = Papa.parse<string[]>(text.trim(), {
    skipEmptyLines: true,
  });
  if (!Array.isArray(parsed.data) || parsed.data.length === 0) {
    return { detectedBank: 'unknown', totalRows: 0, rows: [], skippedLines: [] };
  }
  const [headerRow, ...dataRows] = parsed.data as string[][];
  const bank = detectBank(headerRow);
  const { rows, skippedLines } = transformRows(headerRow, dataRows, bank);
  return {
    detectedBank: bank,
    totalRows: dataRows.length,
    rows,
    skippedLines,
  };
}

// XLSX (ArrayBuffer) → ParseResult. 첫 시트만 처리.
export function parseXlsxBuffer(buf: ArrayBuffer): ParseResult {
  // xlsx 0.18.5: SheetJS Community. SECURITY 노트는 csv-parser.ts 상단 참고.
  const wb = XLSX.read(buf, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    return { detectedBank: 'unknown', totalRows: 0, rows: [], skippedLines: [] };
  }
  const sheet = wb.Sheets[firstSheetName];
  const aoa: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: '',
  });
  if (aoa.length === 0) {
    return { detectedBank: 'unknown', totalRows: 0, rows: [], skippedLines: [] };
  }
  const headerRow = (aoa[0] as unknown[]).map((c) => String(c ?? ''));
  const dataRows = aoa.slice(1);
  const bank = detectBank(headerRow);
  const { rows, skippedLines } = transformRows(headerRow, dataRows, bank);
  return {
    detectedBank: bank,
    totalRows: dataRows.length,
    rows,
    skippedLines,
  };
}

// 파일 → ParseResult. 확장자/MIME 기반 디스패치. 서버 라우트에서 호출.
export async function parseFile(file: File | Blob, name: string): Promise<ParseResult> {
  const ext = (name.split('.').pop() ?? '').toLowerCase();
  if (ext === 'csv') {
    const text = await (file as Blob).text();
    return parseCsvText(text);
  }
  if (ext === 'xlsx' || ext === 'xls') {
    const buf = await (file as Blob).arrayBuffer();
    return parseXlsxBuffer(buf);
  }
  throw new Error('지원하지 않는 파일 형식이에요 (CSV/XLSX만 지원)');
}
