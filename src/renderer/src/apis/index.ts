export const Api = {
  createProject: "/api/v1/sp/project",
  getProjectAll: "/api/v1/sp/projects",
  updateProject: "/api/v1/sp/project",
  deleteProject: "/api/v1/sp/project",
  getProjectList: "/api/v1/sp/project/list",

  getTestCaseDirs: "/api/v1/sp/test-case-dirs",
  addTestCaseDir: "/api/v1/sp/test-case-dir",
  updateTestCaseDir: "/api/v1/sp/test-case-dir",
  deleteTestCaseDir: "/api/v1/sp/test-case-dir",

  getTestCases: "/api/v1/sp/test-cases",
  getTestCase: "/api/v1/sp/test-case",
  addTestCase: "/api/v1/sp/test-case",
  updateTestCase: "/api/v1/sp/test-case",
  deleteTestCase: "/api/v1/sp/test-case",

  // Video analysis service
  createTask: "/api/v1/sp/video/task",
  getTask: "/api/v1/sp/video/task",
  uploadVideo: "/api/v1/sp/video/upload",
  videos: "/api/v1/sp/videos",
  videoStatus: "/api/v1/sp/video/status",
  videoFrames: "/api/v1/sp/video/frames",
};
