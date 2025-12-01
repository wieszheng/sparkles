import { Tray, type BrowserWindow, nativeTheme } from "electron";
import path from "path";

let tray: Tray;

function getIconPath() {
  const isDarkMode = nativeTheme.shouldUseDarkColors;
  return path.join(
    __dirname,
    "..",
    "..",
    "resources",
    process.platform === "darwin"
      ? isDarkMode
        ? "icon-dark.png"
        : "icon-light.png"
      : "icon.png",
  );
}

export function setUpTray(mainWindow: BrowserWindow) {
  if (tray) tray.destroy();

  const iconPath = getIconPath();
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

// 监听主题变化
nativeTheme.on("updated", () => {
  if (tray) {
    tray.setImage(getIconPath()); // 动态更新图标
  }
});

export function destroyTray() {
  tray.destroy();
}
