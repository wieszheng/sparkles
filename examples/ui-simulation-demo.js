/**
 * UI模拟操作示例脚本
 * 
 * 这个脚本演示了如何使用所有的 UI 模拟操作函数
 */

module.exports = async function (task, helpers) {
    helpers.log("=== UI模拟操作示例脚本开始 ===");

    try {
        // ========== 1. 应用控制 ==========
        helpers.log("1. 启动应用");
        await helpers.launchApp(task.packageName);
        await helpers.sleep(3000);

        // ========== 2. 点击操作示例 ==========
        helpers.log("2. 测试点击操作");

        // 单击
        helpers.log("  - 单击 (300, 500)");
        await helpers.uiClick(300, 500);
        await helpers.sleep(1000);

        // 双击
        helpers.log("  - 双击 (300, 600)");
        await helpers.uiDoubleClick(300, 600);
        await helpers.sleep(1000);

        // 长按
        helpers.log("  - 长按 (300, 700)");
        await helpers.uiLongClick(300, 700);
        await helpers.sleep(1000);

        // ========== 3. 滑动操作示例 ==========
        helpers.log("3. 测试滑动操作");

        // 快滑（带惯性）
        helpers.log("  - 快滑向上");
        await helpers.uiFling(300, 800, 300, 200, 1000);
        await helpers.sleep(2000);

        // 慢滑
        helpers.log("  - 慢滑向下");
        await helpers.uiSwipe(300, 200, 300, 800, 500);
        await helpers.sleep(2000);

        // 方向滑动 - 向左
        helpers.log("  - 方向滑动：向左");
        await helpers.uiDircFling(helpers.SwipeDirection.LEFT, 800);
        await helpers.sleep(1500);

        // 方向滑动 - 向右
        helpers.log("  - 方向滑动：向右");
        await helpers.uiDircFling(helpers.SwipeDirection.RIGHT, 800);
        await helpers.sleep(1500);

        // 方向滑动 - 向上
        helpers.log("  - 方向滑动：向上");
        await helpers.uiDircFling(helpers.SwipeDirection.UP, 1000);
        await helpers.sleep(1500);

        // 拖拽
        helpers.log("  - 拖拽操作");
        await helpers.uiDrag(200, 400, 400, 600, 600);
        await helpers.sleep(1500);

        // ========== 4. 文本输入示例 ==========
        helpers.log("4. 测试文本输入");

        // 点击输入框
        helpers.log("  - 点击输入框");
        await helpers.uiClick(300, 400);
        await helpers.sleep(500);

        // 使用焦点输入
        helpers.log("  - 焦点输入文本");
        await helpers.uiText("Hello World");
        await helpers.sleep(1000);

        // 清空并使用坐标输入
        helpers.log("  - 坐标输入文本");
        await helpers.uiInputText(300, 400, "Test Input");
        await helpers.sleep(1000);

        // ========== 5. 按键事件示例 ==========
        helpers.log("5. 测试按键事件");

        // 返回上一级
        helpers.log("  - 返回上一级");
        await helpers.uiGoBack();
        await helpers.sleep(1000);

        // 返回主页
        helpers.log("  - 返回主页");
        await helpers.uiGoHome();
        await helpers.sleep(1000);

        // 重新启动应用
        await helpers.launchApp(task.packageName);
        await helpers.sleep(2000);

        // 粘贴操作（需要剪贴板有内容）
        helpers.log("  - 粘贴操作");
        await helpers.uiClick(300, 400);
        await helpers.sleep(500);
        await helpers.uiPaste();
        await helpers.sleep(1000);

        // ========== 6. 图片匹配 + UI操作示例 ==========
        helpers.log("6. 测试图片匹配");

        // 注意：这里需要替换为实际的图片 base64 数据
        // const templateImage = "data:image/png;base64,...";
        // const result = await helpers.matchImage(templateImage, 0.8);
        // 
        // if (result.found && result.center) {
        //   helpers.log(`  - 找到目标，置信度: ${result.confidence}`);
        //   await helpers.uiClick(result.center.x, result.center.y);
        //   await helpers.sleep(1000);
        // } else {
        //   helpers.log("  - 未找到目标");
        // }

        // ========== 7. 组合操作示例 ==========
        helpers.log("7. 测试组合操作");

        // 模拟登录流程
        helpers.log("  - 模拟登录流程");

        // 点击用户名输入框
        await helpers.uiClick(300, 300);
        await helpers.sleep(500);
        await helpers.uiText("testuser");
        await helpers.sleep(500);

        // 点击密码输入框
        await helpers.uiClick(300, 400);
        await helpers.sleep(500);
        await helpers.uiText("password123");
        await helpers.sleep(500);

        // 点击登录按钮
        await helpers.uiClick(300, 500);
        await helpers.sleep(2000);

        // 滑动浏览内容
        helpers.log("  - 滑动浏览内容");
        for (let i = 0; i < 3; i++) {
            await helpers.uiDircFling(helpers.SwipeDirection.UP, 800);
            await helpers.sleep(1500);

            // 检查是否中止
            if (helpers.isAborted()) {
                helpers.log("任务已中止");
                return;
            }
        }

        // ========== 8. 返回主页 ==========
        helpers.log("8. 返回主页");
        await helpers.uiGoHome();
        await helpers.sleep(1000);

        helpers.log("=== UI模拟操作示例脚本完成 ===");

    } catch (error) {
        helpers.log(`脚本执行出错: ${error.message}`);
        throw error;
    }
};
