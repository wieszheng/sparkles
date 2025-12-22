import { sendKey, shell, KeyCode } from "./utils";
import assert from "node:assert";
import { getClient } from "./index";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function startApp(
  connectKey: string,
  packageName: string,
): Promise<string | string[]> {
  const client = getClient();
  return await shell(
    client,
    connectKey,
    `aa start -a EntryAbility -b ${packageName}`,
  );
}

export async function stopApp(
  connectKey: string,
  packageName: string,
): Promise<string | string[]> {
  const client = getClient();

  return await shell(client, connectKey, `aa force-stop ${packageName}`);
}
export async function clearApp(
  connectKey: string,
  packageName: string,
): Promise<void> {
  const client = getClient();

  await shell(client, connectKey, `bm clean -n ${packageName} -c`);
  await shell(client, connectKey, `bm clean -n ${packageName} -d`);
}
export async function forceStartApp(
  connectKey: string,
  packageName: string,
): Promise<void> {
  await stopApp(connectKey, packageName);
  await sleep(1000);
  await goHome(connectKey);
  await startApp(connectKey, packageName);
}
export async function goBack(connectKey: string): Promise<string | string[]> {
  const client = getClient();

  return await sendKey(client, connectKey, KeyCode.BACK);
}

export async function goHome(connectKey: string): Promise<string | string[]> {
  const client = getClient();

  return await sendKey(client, connectKey, KeyCode.HOME);
}

export async function clickCmd(
  connectKey: string,
  clickType: "click" | "double" | "long" | "input",
  position: {
    x: number;
    y: number;
    text?: string;
  },
) {
  const client = getClient();
  assert(
    clickType === "input" ||
      clickType === "click" ||
      clickType === "double" ||
      clickType === "long",
    "Invalid click type",
  );
  assert(position.x >= 0 && position.y >= 0, "Invalid position");

  switch (clickType) {
    case "input":
      return await shell(
        client,
        connectKey,
        `uitest uiInput inputText ${position.x} ${position.y} ${position.text}`,
      );
    case "long":
      return await shell(
        client,
        connectKey,
        `uitest uiInput longClick ${position.x} ${position.y}`,
      );
    case "double":
      return await shell(
        client,
        connectKey,
        `uitest uiInput doubleClick ${position.x} ${position.y}`,
      );
    default:
      return await shell(
        client,
        connectKey,
        `uitest uiInput click ${position.x} ${position.y}`,
      );
  }
}
