// =====================================================================
// lib/types/database.ts
// Supabase 마이그레이션을 참고해 수동으로 작성한 Database 타입.
// supabase gen types를 실행할 수 있는 환경에서는 자동 생성으로 대체 권장.
// 출처: supabase/migrations/20260520000001 ~ 09
//
// 주의: @supabase/supabase-js v2.106+의 GenericSchema 호환을 위해
// __InternalSupabase, Views, Tables[*].Relationships 필드를 모두 포함해야 한다.
// =====================================================================

export type UserRole = 'member' | 'officer' | 'admin';
export type ProfileStatus = 'pending' | 'active' | 'suspended' | 'withdrawn';
export type PostCategory = 'general' | 'question' | 'share' | 'recruit';
export type RsvpStatus = 'going' | 'not_going' | 'maybe';
export type DuesStatus = 'unpaid' | 'paid' | 'exempt' | 'partial';
export type NotificationKind =
  | 'notice_published'
  | 'comment_on_my_post'
  | 'reply_to_my_comment'
  | 'event_upcoming'
  | 'dues_status_changed'
  | 'membership_approved'
  | 'membership_rejected';

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  // supabase-js v2.106+ 호환을 위한 내부 슬롯
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          student_id: string | null;
          cohort_year: number | null;
          lab: string | null;
          phone: string | null;
          role: UserRole;
          status: ProfileStatus;
          approved_at: string | null;
          approved_by: string | null;
          rejected_reason: string | null;
          is_anonymous_placeholder: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          student_id?: string | null;
          cohort_year?: number | null;
          lab?: string | null;
          phone?: string | null;
          role?: UserRole;
          status?: ProfileStatus;
          approved_at?: string | null;
          approved_by?: string | null;
          rejected_reason?: string | null;
          is_anonymous_placeholder?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          student_id?: string | null;
          cohort_year?: number | null;
          lab?: string | null;
          phone?: string | null;
          role?: UserRole;
          status?: ProfileStatus;
          approved_at?: string | null;
          approved_by?: string | null;
          rejected_reason?: string | null;
          is_anonymous_placeholder?: boolean;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      notices: {
        Row: {
          id: string;
          title: string;
          body_md: string;
          pinned: boolean;
          pinned_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          body_md: string;
          pinned?: boolean;
          pinned_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          body_md?: string;
          pinned?: boolean;
          pinned_at?: string | null;
          created_by?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          category: PostCategory;
          title: string;
          body_md: string;
          is_hidden: boolean;
          hidden_by: string | null;
          hidden_at: string | null;
          comment_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          category?: PostCategory;
          title: string;
          body_md: string;
          is_hidden?: boolean;
          hidden_by?: string | null;
          hidden_at?: string | null;
          comment_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          category?: PostCategory;
          title?: string;
          body_md?: string;
          is_hidden?: boolean;
          hidden_by?: string | null;
          hidden_at?: string | null;
          comment_count?: number;
          created_by?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          parent_id: string | null;
          body_md: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          parent_id?: string | null;
          body_md: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          parent_id?: string | null;
          body_md?: string;
          created_by?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          description_md: string | null;
          location: string | null;
          starts_at: string;
          ends_at: string | null;
          is_all_day: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description_md?: string | null;
          location?: string | null;
          starts_at: string;
          ends_at?: string | null;
          is_all_day?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description_md?: string | null;
          location?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          is_all_day?: boolean;
          created_by?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      event_rsvps: {
        Row: {
          event_id: string;
          member_id: string;
          status: RsvpStatus;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          event_id: string;
          member_id: string;
          status?: RsvpStatus;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          event_id?: string;
          member_id?: string;
          status?: RsvpStatus;
          note?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      dues_term: {
        Row: {
          id: string;
          label: string;
          amount_krw: number;
          due_date: string | null;
          description_md: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          label: string;
          amount_krw: number;
          due_date?: string | null;
          description_md?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          label?: string;
          amount_krw?: number;
          due_date?: string | null;
          description_md?: string | null;
          created_by?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      dues_payment: {
        Row: {
          id: string;
          dues_term_id: string;
          member_id: string;
          status: DuesStatus;
          paid_amount_krw: number | null;
          memo: string | null;
          paid_at: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dues_term_id: string;
          member_id: string;
          status?: DuesStatus;
          paid_amount_krw?: number | null;
          memo?: string | null;
          paid_at?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dues_term_id?: string;
          member_id?: string;
          status?: DuesStatus;
          paid_amount_krw?: number | null;
          memo?: string | null;
          paid_at?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          kind: NotificationKind;
          title: string;
          body: string | null;
          notice_id: string | null;
          post_id: string | null;
          comment_id: string | null;
          event_id: string | null;
          dues_payment_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          kind: NotificationKind;
          title: string;
          body?: string | null;
          notice_id?: string | null;
          post_id?: string | null;
          comment_id?: string | null;
          event_id?: string | null;
          dues_payment_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          kind?: NotificationKind;
          title?: string;
          body?: string | null;
          notice_id?: string | null;
          post_id?: string | null;
          comment_id?: string | null;
          event_id?: string | null;
          dues_payment_id?: string | null;
          read_at?: string | null;
        };
        Relationships: [];
      };
      attachments: {
        Row: {
          id: string;
          storage_path: string;
          file_name: string;
          mime_type: string | null;
          size_bytes: number | null;
          notice_id: string | null;
          post_id: string | null;
          comment_id: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          storage_path: string;
          file_name: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          notice_id?: string | null;
          post_id?: string | null;
          comment_id?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          storage_path?: string;
          file_name?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          notice_id?: string | null;
          post_id?: string | null;
          comment_id?: string | null;
          uploaded_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      list_dues_unpaid: {
        Args: { p_dues_term_id: string };
        Returns: Array<{
          member_id: string;
          name: string;
          cohort_year: number | null;
          lab: string | null;
          phone: string | null;
          status: DuesStatus;
          memo: string | null;
          updated_at: string;
        }>;
      };
      approve_membership: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      reject_membership: {
        Args: { p_user_id: string; p_reason: string };
        Returns: undefined;
      };
      mark_all_notifications_read: {
        Args: Record<string, never>;
        Returns: number;
      };
      grant_officer: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      revoke_officer: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      profile_status: ProfileStatus;
      post_category: PostCategory;
      rsvp_status: RsvpStatus;
      notification_kind: NotificationKind;
    };
    CompositeTypes: Record<string, never>;
  };
}

// 편의 alias
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Notice = Database['public']['Tables']['notices']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type EventRow = Database['public']['Tables']['events']['Row'];
export type EventRsvp = Database['public']['Tables']['event_rsvps']['Row'];
export type DuesTerm = Database['public']['Tables']['dues_term']['Row'];
export type DuesPayment = Database['public']['Tables']['dues_payment']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

// Json 타입은 첨부 등에서 사용 가능 (현재는 미사용이지만 일관성 위해 export)
export type { Json };
