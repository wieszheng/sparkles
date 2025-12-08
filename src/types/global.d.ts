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

interface Frame {
  id: number;
  frame_index: number;
  timestamp: number;
  url: string;
}

interface FrameMark {
  timestamp: number; // in seconds
  thumbnailUrl: string;
}

interface VideoItem {
  id: string;
  name: string;
  url: string; // Blob URL
  fps: number; // 30 or 60
  duration: number; // video duration in seconds
  startFrame: FrameMark | null;
  endFrame: FrameMark | null;
}

interface Task {
  id: string;
  name: string;
  createdAt: number;
  videos: VideoItem[];
  description?: string;
}
