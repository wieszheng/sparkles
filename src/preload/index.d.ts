import { ElectronAPI } from "@electron-toolkit/preload";

interface Api {
  callApi: (method: string, endpoint: string, data?: object) => Promise<any>;
  checkForUpdate: () => Promise<void>;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => void;
  removeUpdateStatusListener: (callback: (status: UpdateStatus) => void) => void;
  respondToUpdatePrompt: (action: string) => void;
  installUpdateNow: () => Promise<void>;
  getTargets: () => Promise<Target[]>;
  screencap: (connectKey: string,saveToLocal?:boolean) => Promise<string>;

  getToolSettings: () => Promise<any>;
  setToolSettings: (settings: object) => Promise<any>;
  getSystemSettings: () => Promise<any>;
  setSystemSettings: (settings: object) => Promise<any>;
}

declare global {

  interface IElectronAPI extends ElectronAPI {
    pf: string
  }
  interface Window {
    electron: IElectronAPI;
    api: Api;
  }
}
