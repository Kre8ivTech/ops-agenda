/**
 * Ops Agenda — Core Type Definitions
 * 
 * This file contains all shared TypeScript types and interfaces
 * used across the application.
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
  work_hours_start: string; // HH:mm format
  work_hours_end: string; // HH:mm format
  data_retention_days: number;
  onboarding_completed: boolean;
}

export interface MicrosoftAccount {
  id: string;
  user_id: string;
  microsoft_user_id: string;
  email: string;
  access_token_encrypted: string; // AES-256-GCM encrypted
  refresh_token_encrypted: string; // AES-256-GCM encrypted
  token_expires_at: string;
  last_sync_at: string | null;
  delta_token_email: string | null;
  delta_token_calendar: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Email Types
// ============================================================================

export interface EmailMetadata {
  id: string;
  user_id: string;
  microsoft_message_id: string;
  subject: string;
  from_email: string;
  from_name: string | null;
  to_emails: string[];
  cc_emails: string[];
  snippet: string; // First 200 chars only
  received_at: string;
  has_attachments: boolean;
  importance: "low" | "normal" | "high";
  is_read: boolean;
  created_at: string;
}

export type Priority = "P1" | "P2" | "P3" | "FYSA";

export interface AIClassification {
  id: string;
  email_id: string;
  user_id: string;
  priority: Priority;
  confidence: number; // 0.0 - 1.0
  reasoning: string;
  user_corrected: boolean;
  corrected_priority: Priority | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Calendar Types
// ============================================================================

export interface CalendarEvent {
  id: string;
  user_id: string;
  microsoft_event_id: string;
  subject: string;
  start_time: string;
  end_time: string;
  location: string | null;
  is_online_meeting: boolean;
  join_url: string | null;
  attendees: EventAttendee[];
  is_all_day: boolean;
  calendar_name: string;
  created_at: string;
}

export interface EventAttendee {
  email: string;
  name: string | null;
  response_status: "none" | "organizer" | "tentativelyAccepted" | "accepted" | "declined";
}

// ============================================================================
// Due-Out Types
// ============================================================================

export interface DueOut {
  id: string;
  user_id: string;
  email_id: string;
  task_description: string;
  due_date: string;
  requester_email: string;
  requester_name: string | null;
  confidence: number; // 0.0 - 1.0
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Daily Ops Brief Types
// ============================================================================

export interface DailyOpsBrief {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  narrative: string;
  top_priorities: TopPriority[];
  timeline: TimelineEvent[];
  due_outs: DueOut[];
  meeting_prep: MeetingPrep[];
  focus_blocks: FocusBlock[];
  generated_at: string;
}

export interface TopPriority {
  id: string;
  type: "email" | "due_out";
  title: string;
  deadline: string | null;
  source_id: string; // email_id or due_out_id
  confidence: number;
  rank: number; // 1, 2, or 3
}

export interface TimelineEvent {
  id: string;
  type: "meeting" | "focus_block";
  title: string;
  start_time: string;
  end_time: string;
  location: string | null;
  is_conflict: boolean;
}

export interface MeetingPrep {
  id: string;
  calendar_event_id: string;
  meeting_title: string;
  start_time: string;
  attendees: EventAttendee[];
  related_emails: EmailMetadata[];
  ai_prep_notes: string;
}

export interface FocusBlock {
  id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  suggested_task: string | null;
}

// ============================================================================
// AI Processing Types
// ============================================================================

export interface OpenAIClassificationRequest {
  emails: {
    id: string;
    subject: string;
    from: string;
    snippet: string;
  }[];
}

export interface OpenAIClassificationResponse {
  classifications: {
    email_id: string;
    priority: Priority;
    confidence: number;
    reasoning: string;
  }[];
}

export interface OpenAIDueOutRequest {
  emails: {
    id: string;
    subject: string;
    snippet: string;
    from: string;
    received_at: string;
  }[];
  current_date: string;
}

export interface OpenAIDueOutResponse {
  due_outs: {
    email_id: string;
    task_description: string;
    due_date: string; // ISO 8601
    requester: string;
    confidence: number;
  }[];
}

export interface OpenAINarrativeRequest {
  user_name: string;
  date: string;
  meetings: CalendarEvent[];
  priorities: TopPriority[];
  due_outs: DueOut[];
  focus_blocks: FocusBlock[];
}

export interface OpenAINarrativeResponse {
  narrative: string;
}

// ============================================================================
// Inngest Event Types
// ============================================================================

export interface SyncEmailsEvent {
  name: "sync/emails.full" | "sync/emails.incremental";
  data: {
    user_id: string;
    microsoft_account_id: string;
  };
}

export interface SyncCalendarEvent {
  name: "sync/calendar.full" | "sync/calendar.incremental";
  data: {
    user_id: string;
    microsoft_account_id: string;
  };
}

export interface ProcessEmailsEvent {
  name: "ai/process-emails";
  data: {
    user_id: string;
    email_ids: string[];
  };
}

export interface GenerateBriefEvent {
  name: "ai/generate-brief";
  data: {
    user_id: string;
    date: string; // YYYY-MM-DD
  };
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// ============================================================================
// Settings Types
// ============================================================================

export interface UserSettings {
  user_id: string;
  work_hours_start: string;
  work_hours_end: string;
  data_retention_days: number;
  notifications_enabled: boolean;
  draft_replies_enabled: boolean;
  due_out_detection_enabled: boolean;
  updated_at: string;
}

// ============================================================================
// Audit Log Types
// ============================================================================

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
