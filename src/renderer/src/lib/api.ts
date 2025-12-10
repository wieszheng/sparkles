const BASE_URL = "http://127.0.0.1:8000/api/v1";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  return response.json();
}

export const api = {
  // --- Task Management ---

  async getTasks(skip = 0, limit = 100): Promise<Task[]> {
    const res = await fetch(`${BASE_URL}/task/?skip=${skip}&limit=${limit}`);
    return handleResponse<Task[]>(res);
  },

  async getTaskDetail(taskId: string): Promise<Task> {
    const res = await fetch(`${BASE_URL}/task/${taskId}`);
    return handleResponse<Task>(res);
  },

  async createTask(data: CreateTaskRequest): Promise<Task> {
    const res = await fetch(`${BASE_URL}/task/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Task>(res);
  },

  async deleteTask(taskId: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/task/${taskId}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },

  async addVideosToTask(taskId: string, videoIds: string[]): Promise<any> {
    const res = await fetch(`${BASE_URL}/task/${taskId}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_ids: videoIds }),
    });
    return handleResponse(res);
  },

  async removeVideoFromTask(taskId: string, videoId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/task/${taskId}/videos/${videoId}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },

  async exportTaskData(taskId: string): Promise<void> {
    // Trigger CSV download by fetching the calculate/stats endpoint or constructing client side.
    // Since the prompt implemented client-side CSV, we will fetch details and stick to client-side generation for now
    // unless there is a specific export endpoint.
    // The previous implementation generated CSV from state. We will keep that in App.tsx.
  },

  // --- Video Management ---

  async uploadVideo(
    file: File,
  ): Promise<{ video_id: string; task_id: string; status: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BASE_URL}/video/upload`, {
      method: "POST",
      body: formData,
    });
    return handleResponse(res);
  },

  async getVideoStatus(videoId: string): Promise<VideoDetail> {
    const res = await fetch(`${BASE_URL}/video/status/${videoId}`);
    return handleResponse<VideoDetail>(res);
  },

  // --- Review ---

  async submitFrameMarking(videoId: string, data: MarkFramesRequest) {
    const res = await fetch(`${BASE_URL}/review/${videoId}/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};
