import {
  Menu,
  type MenuItemConstructorOptions,
  ipcMain,
  app,
  shell,
} from "electron";

export function setupMenu() {
  type MenuItemsType = MenuItemConstructorOptions[];
  const menuOption: MenuItemsType = [
    {
      label: app.name,
      submenu: [
        {
          label: "关于",
          role: "about",
        },
        { type: "separator" },
        {
          label: "隐藏其他",
          role: "hideOthers",
        },
        {
          label: "显示全部",
          role: "unhide",
        },
        { type: "separator" },
        {
          label: `隐藏 ${app.name}`,
          role: "hide",
        },
        {
          label: `退出 ${app.name}`,
          role: "quit",
        },
      ],
    },
    // 编辑菜单
    {
      label: "编辑",
      submenu: [
        { label: "撤销", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "重做", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
        { type: "separator" },
        { label: "剪切", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "复制", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "粘贴", accelerator: "CmdOrCtrl+V", role: "paste" },
        {
          label: "选择性粘贴",
          accelerator: "CmdOrCtrl+Shift+V",
          role: "pasteAndMatchStyle",
        },
        { label: "删除", role: "delete" },
        { label: "全选", accelerator: "CmdOrCtrl+A", role: "selectAll" },
        { type: "separator" },
        {
          label: "语音",
          submenu: [
            { label: "开始朗读", role: "startSpeaking" },
            { label: "停止朗读", role: "stopSpeaking" },
          ],
        },
      ],
    },
    // 帮助菜单
    {
      label: "帮助",
      submenu: [
        {
          label: "访问官网",
          click: async () => {
            await shell.openExternal("https://example.com");
          },
        },
        { type: "separator" },
        {
          label: "反馈",
          click: async () => {
            await shell.openExternal("https://github.com/yourapp/issues");
          },
        },
      ],
    },
  ];
  const handleOption = Menu.buildFromTemplate(menuOption); // 构造MenuItem的选项数组。
  // 设置菜单
  // Menu.setApplicationMenu(null)
  Menu.setApplicationMenu(handleOption);
}

ipcMain.on("SetupMenu", setupMenu);
