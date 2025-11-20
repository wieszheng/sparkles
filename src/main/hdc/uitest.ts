import { UiDriver } from "hdckit";
import { getClient, getWindow } from "./index.ts";
import each from "licia/each";

// 缓存 UiDriver 实例，避免重复创建
const uiDriverCache = new Map<string, UiDriver>();

async function getUiDriver(connectKey: string): Promise<UiDriver> {
  if (!uiDriverCache.has(connectKey)) {
    const target = getClient().getTarget(connectKey);
    const driver = await target.createUiDriver();
    await driver.stop();
    uiDriverCache.set(connectKey, driver);
  }
  return uiDriverCache.get(connectKey)!;
}

const dumpWindowHierarchy = async function (connectKey) {
  const uiDriver = await getUiDriver(connectKey);
  const layout = await uiDriver.captureLayout();
  return toHierarchyXml(layout);
};

function toHierarchyXml(json: any) {
  const { attributes, children } = json;
  let xml = "";

  const tagName = attributes.type;
  delete attributes.type;
  xml += `<${tagName || "Layout"}`;
  each(attributes, (val, key) => {
    xml += ` ${key}="${val}"`;
  });
  xml += ">";

  each(children, (child) => {
    xml += toHierarchyXml(child);
  });

  return xml + `</${tagName || "Layout"}>`;
}

const startCaptureScreen = async function (connectKey, scale) {
  const uiDriver = await getUiDriver(connectKey);
  await stopCaptureScreen(connectKey);
  await uiDriver.startCaptureScreen(
    function (image) {
      // console.log("captureScreen", image);
      getWindow().webContents.send(
        "screencast",
        "captureScreen",
        connectKey,
        image,
      );
    },
    {
      scale,
    },
  );
};
const stopCaptureScreen = async function (connectKey) {
  const uiDriver = await getUiDriver(connectKey);
  await uiDriver.stopCaptureScreen();
};

const touchDown = async function (connectKey, x, y) {
  const uiDriver = await getUiDriver(connectKey);
  await uiDriver.touchDown(x, y);
};

const touchMove = async function (connectKey, x, y) {
  const uiDriver = await getUiDriver(connectKey);
  await uiDriver.touchMove(x, y);
};

const touchUp = async function (connectKey, x, y) {
  const uiDriver = await getUiDriver(connectKey);
  await uiDriver.touchUp(x, y);
};

const inputText = async function (connectKey, text) {
  const uiDriver = await getUiDriver(connectKey);
  await uiDriver.inputText(text);
};
export async function click(
  connectKey: string,
  position: {
    x: number;
    y: number;
  },
) {
  await getUiDriver(connectKey);
//   await driver.click(position.x, position.y);
  console.log(position);
}

export async function longClick(
  connectKey: string,
  position: {
    x: number;
    y: number;
  },
) {
  await getUiDriver(connectKey);
  // await driver.longClick(position.x, position.y);

  console.log(position);
}

export async function doubleClick(
  connectKey: string,
  position: {
    x: number;
    y: number;
  },
) {
  await getUiDriver(connectKey);
  // await driver.doubleClick(position.x, position.y);
  console.log(position);
}
export async function swipe(
  connectKey: string,
  start: {
    x: number;
    y: number;
  },
  end: {
    x: number;
    y: number;
  },
) {
  await getUiDriver(connectKey);
  // await driver.swipe(start.x, start.y, end.x, end.y);
  console.log(start.x, start.y, end.x, end.y);
}

export {
  touchUp,
  touchMove,
  touchDown,
  inputText,
  dumpWindowHierarchy,
  startCaptureScreen,
  stopCaptureScreen,
};
