export interface Target {
  key: string;
  name: string;
  ohosVersion: string;
  sdkVersion: string;
}

export type GetTargets = () => Promise<Target[]>;
export type Screencap = (connectKey: string, saveToLocal?: boolean) => Promise<string>;
