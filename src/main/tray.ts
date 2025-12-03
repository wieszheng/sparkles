import { Tray, type BrowserWindow, nativeImage } from "electron";
import path from "path";

let tray: Tray;

function getIconPath() {
  const platform = process.platform;

  if (platform === "darwin") {
    // macOS 使用 Template 图标
    return path.join(__dirname, "..", "..", "resources", "iconTemplate.png");
  } else {
    return path.join(__dirname, "..", "..", "resources", "icon.png");
  }
}

export function setUpTray(mainWindow: BrowserWindow) {
  if (tray) tray.destroy();
  const iconPath = getIconPath();
  const icon = nativeImage.createFromPath(iconPath);

  if (process.platform === "darwin") {
    icon.setTemplateImage(true);
  }

  tray = new Tray(iconPath);

  // 设置托盘标题（仅 macOS）
  // if (process.platform === "darwin") {
  //   tray.setTitle("Sparkles");
  // }
  tray.setToolTip("Sparkles");

  // 单击托盘图标（Windows）
  tray.on("click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.setOpacity(0);
      mainWindow.show();
      mainWindow.setOpacity(1);
    }
  });
}

export function destroyTray() {
  tray.destroy();
}
