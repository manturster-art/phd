// C-421 DuesMatrixTable (데스크톱 전용, md 이상)
'use client';

import { DuesStatusBadge } from './DuesStatusBadge';
import type { DuesMatrixRow } from '@/lib/api/dues';

interface Props {
  rows: DuesMatrixRow[];
  onCellTap: (row: DuesMatrixRow) => void;
}

export function DuesMatrixTable({ rows, onCellTap }: Props) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-bg-subtle text-left">
          <tr>
            <th className="px-3 py-2 font-medium">이름</th>
            <th className="px-3 py-2 font-medium">학번</th>
            <th className="px-3 py-2 font-medium">연구실</th>
            <th className="px-3 py-2 font-medium">상태</th>
            <th className="px-3 py-2 font-medium">메모</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const m = row.member;
            return (
              <tr
                key={row.id}
                className="cursor-pointer border-t border-border hover:bg-bg-subtle"
                onClick={() => onCellTap(row)}
              >
                <td className="px-3 py-2 font-medium">{m?.name ?? '(탈퇴회원)'}</td>
                <td className="px-3 py-2 text-text-secondary">{m?.cohort_year ?? '-'}</td>
                <td className="px-3 py-2 text-text-secondary">{m?.lab ?? '-'}</td>
                <td className="px-3 py-2">
                  <DuesStatusBadge status={row.status} />
                </td>
                <td className="px-3 py-2 text-text-secondary">{row.memo ?? ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
