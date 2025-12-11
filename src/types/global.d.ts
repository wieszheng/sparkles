type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

type BodyType = "json" | "text" | "formData" | "blob";

interface ApiCallPayload {
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  data?: object;
  contentType?: "json" | "form-data";
}

interface FormDataField {
  name: string;
  value?: string | number | boolean;
  type?: "file" | "buffer" | "field";
  filePath?: string;
  filename?: string;
  contentType?: string;
  buffer?: ArrayBuffer | Uint8Array;
}

interface RequestOptions {
  endpoint: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  bodyType?: BodyType;
  formData?: any;
}

interface UploadFileOptions {
  endpoint: string;
  filePath: string;
  fieldName?: string;
  additionalFields?: Record<string, string | number>;
  headers?: Record<string, string>;
}

interface UpdateStatus {
  status:
    | "checking"
    | "update-available"
    | "downloading"
    | "progress"
    | "ready"
    | "up-to-date"
    | "error";
  message: string;
  versionInfo?: { version: string; releaseDate: string; releaseNotes?: string };
  progress?: number; // 0-100
}

interface Target {
  key: string;
  name: string;
  ohosVersion: string;
  sdkVersion: string;
}

type GetTargets = () => Promise<Target[]>;
type Screencap = (connectKey: string, saveToLocal?: boolean) => Promise<string>;

type StartScreenRecording = (connectKey: string) => Promise<string>;
type StopScreenRecording = (connectKey: string) => Promise<string>;

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  testCases: number;
  passRate: number;
  lastRun: string;
  team: string[];
  aiInsights: boolean;
  template?: string;
  tags?: string[];
}

interface Directory {
  id: string;
  name: string;
  parent_id: string;
  project_id: string;
  children: Directory[];
  isExpanded?: boolean;
}

interface TestCase {
  id: string;
  name: string;
  content: object;
  description: string;
  creator: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "active" | "disabled" | "archived";
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];
  executionCount: number;
  lastResult: "passed" | "failed" | "skipped" | "pending";
}

interface Application {
  bundleName: string;
  versionName: string;
  icon: string;
  label: string;
  system: boolean;
  apiTargetVersion: number;
  vendor: string;
  installTime: number;
  releaseType: string;
  mainAbility?: string;
}

type VideoStatus =
  | "uploading"
  | "processing"
  | "pending_review"
  | "reviewed"
  | "completed"
  | "failed"
  | "cancelled";

type TaskStatus = "draft" | "in_progress" | "completed" | "archived";

type FrameType = "first" | "last" | "middle";

interface Frame {
  id: string;
  frame_number: number;
  timestamp: number;
  url: string;
  frame_type?: FrameType;
  is_first_candidate: boolean;
  is_last_candidate: boolean;
}

interface TaskVideoSummary {
  id: string; // Relation ID (task_video id)
  video_id: string; // Actual Video ID
  order: number;
  duration_ms: number;
  first_frame_time: number | null;
  last_frame_time: number | null;
  notes: string | null;
  added_at: string;
  video_filename: string;
  video_status: VideoStatus;
  video_width: number;
  video_height: number;
  first_frame_url: string | null;
  last_frame_url: string | null;
}

interface VideoDetail {
  video_id: string;
  filename: string;
  status: VideoStatus;
  duration: number;
  fps: number;
  width: number;
  height: number;
  task_id: string | null; // Celery task id
  error_message: string | null;
  progress: number;
  current_step: string | null;
  frames: Frame[];
  created_at: string;

  selected_start_frame_id?: string | null;
  selected_end_frame_id?: string | null;
}

interface Task {
  id: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  total_videos: number;
  completed_videos: number;
  failed_videos: number;
  total_duration: number | null;
  avg_duration: number | null;
  min_duration: number | null;
  max_duration: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  videos: TaskVideoSummary[];
}

interface CreateTaskRequest {
  name: string;
  description?: string;
  created_by?: string;
}

interface MarkFramesRequest {
  first_frame_id: string;
  last_frame_id: string;
  reviewer?: string;
  review_notes?: string;
}
