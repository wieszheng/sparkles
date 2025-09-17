import { Hdc, Client } from "hdckit";
import type { GetTargets, Screencap } from "../../types";
import { BrowserWindow } from "electron";
import * as os from "node:os";
import path from "node:path";
import fs from "fs-extra";

let client: Client;

async function shell(
  connectKey: string,
  cmds: string[],
): Promise<string | string[]> {
  const target = client.getTarget(connectKey);

  const connection = await target.shell(cmds.join('\necho "echo_separator"\n'));
  const output = (await connection.readAll()).toString();

  return output.split("echo_separator").map((val) => val);
}

const getTargets: GetTargets = async function () {
  const targets = await client.listTargets();

  return Promise.all(
    targets.map(async (connectKey: string) => {
      const parameters = await client.getTarget(connectKey).getParameters();
      let ohosVersion =
        parameters["const.product.software.version"].split(/\s/)[1];
      ohosVersion = ohosVersion.slice(0, ohosVersion.indexOf("("));

      const sdkVersion = parameters["const.ohos.apiversion"];

      return {
        name: parameters["const.product.name"],
        key: connectKey,
        ohosVersion,
        sdkVersion,
      };
    }),
  ).catch(() => []);
};

const screencap: Screencap = async function (connectKey: string) {
  const name = "echo_screen.jpeg";
  const p = `/data/local/tmp/${name}`;
  await shell(connectKey, [`rm -r ${p}`, `snapshot_display -i 0 -f ${p}`]);
  console.log("screencap", p);
  const target = client.getTarget(connectKey);
  const dest = path.resolve(os.tmpdir(), name);
  await target.recvFile(p, dest);
  const buf = await fs.readFile(dest);

  return buf.toString("base64");
};

export async function initHdcClient(win: BrowserWindow) {
  client = Hdc.createClient();
  client.trackTargets().then((tracker) => {
    tracker.on("add", onTargetChange);
    tracker.on("remove", onTargetChange);
  });
  function onTargetChange() {
    if (win) {
      setTimeout(() => win.webContents.send("hdc", "changeTarget"), 2000);
    }
  }
}

export { getTargets, screencap };
