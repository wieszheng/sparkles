import { ElectronAPI } from "@electron-toolkit/preload";

interface Api {
  checkForUpdate: () => Promise<void>;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => void;
  removeUpdateStatusListener: (callback: (status: UpdateStatus) => void) => void;
  respondToUpdatePrompt: (action: string) => void;
  installUpdateNow: () => Promise<void>;
  getTargets: () => Promise<Target[]>;
  screencap: (connectKey: string) => Promise<string>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: Api;
  }
}
