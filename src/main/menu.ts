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
          label: `关于 ${app.name}`,
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
