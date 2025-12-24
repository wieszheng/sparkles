# 脚本示例

本目录包含各种脚本模板示例，展示如何使用 UI 模拟操作 API。

## 示例列表

### ui-simulation-demo.js

完整的 UI 模拟操作演示脚本，包含：

- ✅ 点击操作（单击、双击、长按）
- ✅ 滑动操作（快滑、慢滑、拖拽、方向滑动）
- ✅ 文本输入（坐标输入、焦点输入）
- ✅ 按键事件（返回、主页、粘贴）
- ✅ 图片匹配示例
- ✅ 组合操作示例

**使用方法：**

1. 将此脚本内容复制到脚本模板编辑器
2. 修改 `task.packageName` 为目标应用包名
3. 根据实际应用界面调整坐标值
4. 保存并运行

### hilog-analysis-demo.js

HiLog 日志分析演示脚本，包含：

- ✅ 自动 HiLog 日志采集
- ✅ 应用操作执行
- ✅ 日志分析说明
- ✅ 日志工具使用示例

**使用方法：**

1. 将此脚本内容复制到脚本模板编辑器
2. 修改 `task.packageName` 为目标应用包名
3. 保存并运行
4. 查看 `/tmp/sparkles-logs/` 目录获取日志文件
5. 使用 hilog-utils 工具分析日志

**日志位置：**
```
/tmp/sparkles-logs/hilog_<packageName>_<timestamp>.log
```

## 快速开始

### 基础模板

```javascript
module.exports = async function(task, helpers) {
  helpers.log("脚本开始");
  
  // 启动应用
  await helpers.launchApp(task.packageName);
  await helpers.sleep(2000);
  
  // 你的操作代码
  await helpers.uiClick(300, 500);
  
  helpers.log("脚本完成");
};
```

### 登录场景模板

```javascript
module.exports = async function(task, helpers) {
  helpers.log("登录场景开始");
  
  // 启动应用
  await helpers.launchApp(task.packageName);
  await helpers.sleep(2000);
  
  // 输入用户名
  await helpers.uiClick(300, 300);
  await helpers.uiText("username");
  
  // 输入密码
  await helpers.uiClick(300, 400);
  await helpers.uiText("password");
  
  // 点击登录
  await helpers.uiClick(300, 500);
  await helpers.sleep(3000);
  
  helpers.log("登录完成");
};
```

### 滑动浏览模板

```javascript
module.exports = async function(task, helpers) {
  helpers.log("滑动浏览场景开始");
  
  // 启动应用
  await helpers.launchApp(task.packageName);
  await helpers.sleep(2000);
  
  // 向上滑动浏览 5 次
  for (let i = 0; i < 5; i++) {
    helpers.log(`第 ${i + 1} 次滑动`);
    await helpers.uiDircFling(helpers.SwipeDirection.UP, 800);
    await helpers.sleep(2000);
    
    // 检查是否中止
    if (helpers.isAborted()) {
      helpers.log("任务已中止");
      return;
    }
  }
  
  helpers.log("滑动浏览完成");
};
```

### 图片匹配模板

```javascript
module.exports = async function(task, helpers) {
  helpers.log("图片匹配场景开始");
  
  // 启动应用
  await helpers.launchApp(task.packageName);
  await helpers.sleep(2000);
  
  // 匹配按钮图片
  const buttonImage = "data:image/png;base64,..."; // 替换为实际图片
  const result = await helpers.matchImage(buttonImage, 0.8);
  
  if (result.found && result.center) {
    helpers.log(`找到按钮，置信度: ${result.confidence}`);
    await helpers.uiClick(result.center.x, result.center.y);
    await helpers.sleep(1000);
  } else {
    helpers.log("未找到按钮");
  }
  
  helpers.log("图片匹配完成");
};
```

## 注意事项

1. **坐标调整**：示例中的坐标值需要根据实际设备屏幕尺寸和应用界面调整
2. **延时设置**：`sleep` 时间应根据应用响应速度调整
3. **错误处理**：建议使用 try-catch 包裹关键操作
4. **中止检查**：长时间运行的脚本应定期检查 `helpers.isAborted()`
5. **日志记录**：使用 `helpers.log()` 记录关键步骤，便于调试

## 调试技巧

1. **逐步执行**：先注释掉大部分代码，逐步添加操作进行测试
2. **增加延时**：调试时可以增加 `sleep` 时间，便于观察
3. **日志输出**：在关键位置添加日志，了解执行进度
4. **坐标验证**：使用截图工具确认点击坐标是否正确

## 相关文档

- [UI模拟操作API完整文档](../docs/UI_SIMULATION_API.md)
- [UI模拟操作快速参考](../docs/UI_SIMULATION_QUICK_REF.md)
- [UI模拟操作实现总结](../docs/UI_SIMULATION_IMPLEMENTATION.md)
- [HiLog集成文档](../docs/HILOG_INTEGRATION.md)
- [HiLog快速参考](../docs/HILOG_QUICK_REF.md)
- [HiLog实现总结](../docs/HILOG_IMPLEMENTATION.md)
