# UI模拟操作快速参考

## 点击操作

```javascript
// 单击
await helpers.uiClick(x, y);

// 双击
await helpers.uiDoubleClick(x, y);

// 长按
await helpers.uiLongClick(x, y);
```

## 滑动操作

```javascript
// 快滑（带惯性）
await helpers.uiFling(fromX, fromY, toX, toY, speed?, stepLength?);

// 慢滑
await helpers.uiSwipe(fromX, fromY, toX, toY, speed?);

// 拖拽
await helpers.uiDrag(fromX, fromY, toX, toY, speed?);

// 方向滑动
await helpers.uiDircFling(helpers.SwipeDirection.LEFT);   // 左
await helpers.uiDircFling(helpers.SwipeDirection.RIGHT);  // 右
await helpers.uiDircFling(helpers.SwipeDirection.UP);     // 上
await helpers.uiDircFling(helpers.SwipeDirection.DOWN);   // 下
```

## 文本输入

```javascript
// 指定坐标输入
await helpers.uiInputText(x, y, "text");

// 当前焦点输入
await helpers.uiText("text");
```

## 按键事件

```javascript
// 返回主页
await helpers.uiGoHome();

// 返回上一级
await helpers.uiGoBack();

// 电源键
await helpers.uiPowerKey();

// 粘贴
await helpers.uiPaste();

// 自定义按键
await helpers.uiKeyEvent(keyCode);
await helpers.uiKeyEvent(keyCode1, keyCode2);  // 组合键
```

## 应用控制

```javascript
// 启动应用
await helpers.launchApp("com.example.app");

// 停止应用
await helpers.stopApp("com.example.app");
```

## 辅助功能

```javascript
// 日志输出
helpers.log("message");

// 延时
await helpers.sleep(1000);  // 毫秒

// 检查是否中止
if (helpers.isAborted()) {
  return;
}
```

## 图片匹配

```javascript
// 匹配图片模板
const result = await helpers.matchImage(templateBase64, threshold);
if (result.found && result.center) {
  await helpers.uiClick(result.center.x, result.center.y);
}
```

## 滑动方向常量

```javascript
helpers.SwipeDirection.LEFT   // 0 - 向左
helpers.SwipeDirection.RIGHT  // 1 - 向右
helpers.SwipeDirection.UP     // 2 - 向上
helpers.SwipeDirection.DOWN   // 3 - 向下
```

## 常用KeyCode

| 按键 | KeyCode |
|------|---------|
| Shift | 2047 |
| Ctrl | 2072 |
| v | 2038 |
| V (Shift+v) | 2047, 2038 |

## 完整示例

```javascript
module.exports = async function(task, helpers) {
  // 启动应用
  await helpers.launchApp("com.example.app");
  await helpers.sleep(2000);
  
  // 点击输入框并输入
  await helpers.uiClick(200, 300);
  await helpers.uiText("username");
  
  // 滑动
  await helpers.uiDircFling(helpers.SwipeDirection.UP, 800);
  await helpers.sleep(1000);
  
  // 双击
  await helpers.uiDoubleClick(300, 400);
  
  // 返回
  await helpers.uiGoBack();
};
```
