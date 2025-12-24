# UI模拟操作函数文档

本文档详细说明了基于 HarmonyOS uitest API 封装的 UI 模拟操作函数。

## 目录

- [点击操作](#点击操作)
- [滑动操作](#滑动操作)
- [文本输入](#文本输入)
- [按键事件](#按键事件)
- [使用示例](#使用示例)

---

## 点击操作

### uiClick - 单击

模拟单击操作。

**参数：**
- `x: number` - 点击x坐标点
- `y: number` - 点击y坐标点

**示例：**
```javascript
await helpers.uiClick(100, 100);
```

---

### uiDoubleClick - 双击

模拟双击操作。

**参数：**
- `x: number` - 点击x坐标点
- `y: number` - 点击y坐标点

**示例：**
```javascript
await helpers.uiDoubleClick(100, 100);
```

---

### uiLongClick - 长按

模拟长按操作。

**参数：**
- `x: number` - 点击x坐标点
- `y: number` - 点击y坐标点

**示例：**
```javascript
await helpers.uiLongClick(100, 100);
```

---

## 滑动操作

### uiFling - 快滑（带惯性）

模拟快滑操作，操作结束后页面存在惯性滚动。

**参数：**
- `fromX: number` - 滑动起点x坐标
- `fromY: number` - 滑动起点y坐标
- `toX: number` - 滑动终点x坐标
- `toY: number` - 滑动终点y坐标
- `swipeVelocityPps?: number` - 滑动速度，单位：px/s，取值范围：200-40000，默认值：600
- `stepLength?: number` - 滑动步长，单位：px，默认值：滑动距离/50

**示例：**
```javascript
// 基本用法
await helpers.uiFling(10, 10, 200, 200);

// 指定速度
await helpers.uiFling(10, 10, 200, 200, 500);

// 指定速度和步长
await helpers.uiFling(10, 10, 200, 200, 500, 10);
```

---

### uiSwipe - 慢滑

模拟慢滑操作，无惯性滚动。

**参数：**
- `fromX: number` - 滑动起点x坐标
- `fromY: number` - 滑动起点y坐标
- `toX: number` - 滑动终点x坐标
- `toY: number` - 滑动终点y坐标
- `swipeVelocityPps?: number` - 滑动速度，单位：px/s，取值范围：200-40000，默认值：600

**示例：**
```javascript
// 基本用法
await helpers.uiSwipe(10, 10, 200, 200);

// 指定速度
await helpers.uiSwipe(10, 10, 200, 200, 500);
```

---

### uiDrag - 拖拽

模拟拖拽操作。

**参数：**
- `fromX: number` - 拖拽起点x坐标
- `fromY: number` - 拖拽起点y坐标
- `toX: number` - 拖拽终点x坐标
- `toY: number` - 拖拽终点y坐标
- `swipeVelocityPps?: number` - 拖拽速度，单位：px/s，取值范围：200-40000，默认值：600

**示例：**
```javascript
await helpers.uiDrag(10, 10, 100, 100, 500);
```

---

### uiDircFling - 方向滑动

模拟指定方向的滑动操作。

**参数：**
- `direction: number` - 滑动方向
  - `helpers.SwipeDirection.LEFT` (0) - 向左滑动
  - `helpers.SwipeDirection.RIGHT` (1) - 向右滑动
  - `helpers.SwipeDirection.UP` (2) - 向上滑动
  - `helpers.SwipeDirection.DOWN` (3) - 向下滑动
- `swipeVelocityPps?: number` - 滑动速度，单位：px/s，取值范围：200-40000，默认值：600
- `stepLength?: number` - 滑动步长，单位：px

**示例：**
```javascript
// 向左滑动
await helpers.uiDircFling(helpers.SwipeDirection.LEFT);

// 向右滑动，指定速度
await helpers.uiDircFling(helpers.SwipeDirection.RIGHT, 600);

// 向上滑动
await helpers.uiDircFling(helpers.SwipeDirection.UP, 500);

// 向下滑动
await helpers.uiDircFling(helpers.SwipeDirection.DOWN);
```

---

## 文本输入

### uiInputText - 坐标输入

在指定坐标的输入框中输入文本。

**参数：**
- `x: number` - 输入框x坐标点
- `y: number` - 输入框y坐标点
- `text: string` - 输入文本内容

**示例：**
```javascript
await helpers.uiInputText(100, 100, "hello");
```

---

### uiText - 焦点输入

在当前获焦处输入文本（无需指定坐标）。

**参数：**
- `text: string` - 输入文本内容

**示例：**
```javascript
await helpers.uiText("hello");
```

**注意：** 若当前获焦处不支持文本输入，则无实际效果。

---

## 按键事件

### uiKeyEvent - 通用按键

模拟实体按键事件，支持组合键。

**参数：**
- `keyId1: string | number` - 实体按键对应ID，取值范围：Back、Home、Power、或KeyCode键码值
- `keyId2?: string | number` - 可选，实体按键对应ID（用于组合键）
- `keyId3?: string | number` - 可选，实体按键对应ID（用于组合键）

**示例：**
```javascript
// 单个按键
await helpers.uiKeyEvent("Home");

// 组合键（Ctrl+V 粘贴）
await helpers.uiKeyEvent(2072, 2038);

// 输入小写字母v
await helpers.uiKeyEvent(2038);

// 输入大写字母V（Shift+V）
await helpers.uiKeyEvent(2047, 2038);
```

**注意：** 
- 当取值为 Back、Home 或 Power 时，不支持输入组合键
- 当前注入大写锁定键（KeyCode=2074）无效，请使用组合键实现大写字母输入

---

### uiGoHome - 返回主页

返回到主页。

**示例：**
```javascript
await helpers.uiGoHome();
```

---

### uiGoBack - 返回上一级

返回到上一级页面。

**示例：**
```javascript
await helpers.uiGoBack();
```

---

### uiPowerKey - 电源键

模拟按下电源键。

**示例：**
```javascript
await helpers.uiPowerKey();
```

---

### uiPaste - 粘贴

执行粘贴操作（Ctrl+V）。

**示例：**
```javascript
await helpers.uiPaste();
```

---

## 使用示例

### 完整场景示例

```javascript
// 脚本模板示例：登录并滑动浏览
module.exports = async function(task, helpers) {
  helpers.log("开始执行登录场景");
  
  // 1. 启动应用
  await helpers.launchApp("com.example.app");
  await helpers.sleep(2000);
  
  // 2. 点击用户名输入框
  await helpers.uiClick(200, 300);
  await helpers.sleep(500);
  
  // 3. 输入用户名
  await helpers.uiText("testuser");
  await helpers.sleep(500);
  
  // 4. 点击密码输入框
  await helpers.uiClick(200, 400);
  await helpers.sleep(500);
  
  // 5. 输入密码
  await helpers.uiText("password123");
  await helpers.sleep(500);
  
  // 6. 点击登录按钮
  await helpers.uiClick(200, 500);
  await helpers.sleep(3000);
  
  // 7. 向上滑动浏览内容
  await helpers.uiDircFling(helpers.SwipeDirection.UP, 800);
  await helpers.sleep(2000);
  
  // 8. 继续向上滑动
  await helpers.uiFling(300, 800, 300, 200, 1000);
  await helpers.sleep(2000);
  
  // 9. 双击某个元素
  await helpers.uiDoubleClick(300, 400);
  await helpers.sleep(1000);
  
  // 10. 返回主页
  await helpers.uiGoHome();
  
  helpers.log("场景执行完成");
};
```

### 图片匹配 + UI操作示例

```javascript
module.exports = async function(task, helpers) {
  helpers.log("开始图片匹配场景");
  
  // 启动应用
  await helpers.launchApp("com.example.app");
  await helpers.sleep(2000);
  
  // 匹配登录按钮图片
  const loginButton = await helpers.matchImage(
    "base64_encoded_login_button_image",
    0.8
  );
  
  if (loginButton.found && loginButton.center) {
    helpers.log(`找到登录按钮，置信度: ${loginButton.confidence}`);
    
    // 点击登录按钮
    await helpers.uiClick(loginButton.center.x, loginButton.center.y);
    await helpers.sleep(1000);
  } else {
    helpers.log("未找到登录按钮");
  }
  
  helpers.log("场景执行完成");
};
```

---

## 常用KeyCode参考

| 按键 | KeyCode | 说明 |
|------|---------|------|
| Shift | 2047 | 用于组合键 |
| Ctrl | 2072 | 用于组合键 |
| v | 2038 | 小写字母v |
| V | 2047 + 2038 | 大写字母V（Shift+v） |
| 大写锁定 | 2074 | 注意：当前无效 |

更多KeyCode请参考 HarmonyOS 官方文档。

---

## 注意事项

1. **坐标系统**：所有坐标值必须 >= 0
2. **速度范围**：滑动速度参数取值范围为 200-40000 px/s，超出范围时使用默认值 600
3. **步长参数**：推荐使用默认值以获得更好的模拟效果
4. **文本输入**：`uiText` 需要当前焦点在可输入控件上
5. **中止检查**：所有操作都会检查任务是否被中止，如果中止会抛出异常
6. **异步操作**：所有UI操作都是异步的，需要使用 `await` 关键字

---

## 兼容性说明

为保持向后兼容，以下旧版本函数仍然可用：

- `tap(x, y)` - 等同于 `uiClick(x, y)`
- `swipe(x1, y1, x2, y2, duration)` - 基础滑动操作
- `inputText(x, y, text)` - 等同于 `uiInputText(x, y, text)`

建议新脚本使用 `ui*` 系列函数以获得更完整的功能支持。
