import { registerScriptTemplate } from "./engine";
/**
 * 等待指定时间
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * 等待条件满足（带超时）
 */
async function waitForCondition(
  helpers: ScriptHelpers,
  condition: () => Promise<boolean>,
  timeout: number = 30000,
  interval: number = 500,
): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (helpers.isAborted()) {
      return false;
    }
    if (await condition()) {
      return true;
    }
    await sleep(interval);
  }
  return false;
}

/**
 * 查找图像（模拟实现，实际需要使用图像识别库如 opencv-nodejs）
 */
async function findImage(
  helpers: ScriptHelpers,
  imagePath: string,
  threshold: number = 0.8,
): Promise<{ x: number; y: number } | null> {
  // TODO: 实现真实的图像识别逻辑
  // 这里返回模拟结果
  helpers.log(`[模拟] 查找图像: ${imagePath}, 阈值: ${threshold}`);
  await sleep(500);
  // 模拟找到图像
  return { x: 100, y: 200 };
}

// ---- 基础场景模板 ----

// 模板1：启动应用并等待加载完成
registerScriptTemplate({
  id: "launch_and_wait",
  name: "启动应用并等待加载-测试",
  description: "启动目标应用，等待指定时间后完成",
  template: async (task, helpers) => {
    helpers.log(`开始启动应用: ${task.packageName}`);
    await helpers.execHdcShell(
      `aa start -b ${task.packageName} -a EntryAbility`,
    );
    await helpers.sleep(20000);
    await helpers.execHdcShell(`aa force-stop ${task.packageName}`);
    await helpers.sleep(5000);
    await helpers.execHdcShell(
      `aa start -b ${task.packageName} -a EntryAbility`,
    );
    await helpers.sleep(20000);
    await helpers.execHdcShell(`aa force-stop ${task.packageName}`);
    await helpers.sleep(5000);
    await helpers.execHdcShell(
      `aa start -b ${task.packageName} -a EntryAbility`,
    );
    await helpers.sleep(20000);
    await helpers.execHdcShell(`aa force-stop ${task.packageName}`);
    await helpers.sleep(5000);
    await helpers.execHdcShell(
      `aa start -b ${task.packageName} -a EntryAbility`,
    );
    await helpers.sleep(20000);
    await helpers.execHdcShell(`aa force-stop ${task.packageName}`);
    await helpers.sleep(5000);
    await helpers.execHdcShell(
      `aa start -b ${task.packageName} -a EntryAbility`,
    );
    await helpers.sleep(20000);
    await helpers.execHdcShell(`aa force-stop ${task.packageName}`);
    await helpers.sleep(5000);
    await helpers.execHdcShell(
      `aa start -b ${task.packageName} -a EntryAbility`,
    );
    await helpers.sleep(20000);
    await helpers.execHdcShell(`aa force-stop ${task.packageName}`);
    await helpers.sleep(5000);
    await helpers.execHdcShell(
      `aa start -b ${task.packageName} -a EntryAbility`,
    );
    await helpers.sleep(20000);
    await helpers.execHdcShell(`aa force-stop ${task.packageName}`);
    await helpers.sleep(5000);
    helpers.log("场景完成");
  },
});

// 模板2：启动应用并执行简单操作
registerScriptTemplate({
  id: "launch_and_interact",
  name: "启动应用并交互",
  description: "启动应用，等待后执行点击操作",
  template: async (task, helpers) => {
    helpers.log(`Launch the application: ${task.packageName}`);
    await helpers.execHdcShell(`am start -n ${task.packageName}/.MainActivity`);
    await helpers.sleep(3000);
    helpers.log("执行点击操作");
    await helpers.execHdcShell("input tap 200 400");
    await helpers.sleep(2000);
    helpers.log("场景完成");
  },
});

// 模板3：仅等待（用于测试监控流程）
registerScriptTemplate({
  id: "wait_only",
  name: "仅等待测试",
  description: "仅执行等待操作，用于测试监控流程",
  template: async (_task, helpers) => {
    helpers.log("场景开始：等待测试");
    await helpers.sleep(2000);
    helpers.log("等待中...");
    await helpers.sleep(3000);
    helpers.log("场景完成");
  },
});

// ---- 复杂场景模板 ----

// 模板4：循环执行操作
registerScriptTemplate({
  id: "loop_operations",
  name: "循环执行操作",
  description: "循环执行指定次数的操作，监控每次操作的性能",
  template: async (task, helpers) => {
    helpers.log(`开始循环操作场景: ${task.packageName}`);
    await helpers.execHdcShell(`am start -n ${task.packageName}/.MainActivity`);
    await helpers.sleep(3000);

    const loopCount = 5;
    for (let i = 0; i < loopCount; i++) {
      if (helpers.isAborted()) {
        helpers.log("任务已中止");
        break;
      }

      helpers.log(`第 ${i + 1}/${loopCount} 次操作`);
      // 执行滑动操作
      await helpers.execHdcShell(`input swipe 300 800 300 200 500`);
      await helpers.sleep(2000);

      // 执行点击操作
      await helpers.execHdcShell(`input tap 200 ${400 + i * 50}`);
      await helpers.sleep(1500);
    }

    helpers.log("循环操作完成");
  },
});

// 模板5：条件等待 + 找图点击
registerScriptTemplate({
  id: "wait_and_find_image",
  name: "等待并找图点击",
  description: "等待界面元素出现，找到图像后点击",
  template: async (task, helpers) => {
    helpers.log(`启动应用: ${task.packageName}`);
    await helpers.execHdcShell(`am start -n ${task.packageName}/.MainActivity`);
    await helpers.sleep(2000);

    helpers.log("等待主界面加载完成...");
    // 等待主界面加载（通过检查进程是否运行）
    const loaded = await waitForCondition(
      helpers,
      async () => {
        try {
          const output = await helpers.execHdcShell(
            `pidof ${task.packageName}`,
          );
          return output.trim().length > 0;
        } catch {
          return false;
        }
      },
      15000,
      1000,
    );

    if (!loaded) {
      helpers.log("等待超时，继续执行...");
    } else {
      helpers.log("应用已加载");
    }

    // 模拟找图并点击
    helpers.log("查找目标图像...");
    const imagePos = await findImage(helpers, "target_button.png", 0.8);
    if (imagePos) {
      helpers.log(`找到图像，点击位置: (${imagePos.x}, ${imagePos.y})`);
      await helpers.execHdcShell(`input tap ${imagePos.x} ${imagePos.y}`);
      await helpers.sleep(2000);
    } else {
      helpers.log("未找到目标图像");
    }

    helpers.log("场景完成");
  },
});

// 模板6：多次启动和关闭应用（压力测试）
registerScriptTemplate({
  id: "stress_test",
  name: "应用启动压力测试",
  description: "多次启动和关闭应用，测试启动性能",
  template: async (task, helpers) => {
    const cycleCount = 3;
    helpers.log(`开始压力测试: ${cycleCount} 个循环`);

    for (let i = 0; i < cycleCount; i++) {
      if (helpers.isAborted()) {
        helpers.log("任务已中止");
        break;
      }

      helpers.log(`\n=== 第 ${i + 1}/${cycleCount} 次启动 ===`);

      // 确保应用已关闭
      await helpers.execHdcShell(`am force-stop ${task.packageName}`);
      await helpers.sleep(1000);

      // 启动应用
      helpers.log("启动应用...");
      await helpers.execHdcShell(
        `am start -n ${task.packageName}/.splash.SplashActivity`,
      );

      // 等待应用完全加载
      await helpers.sleep(8000);

      helpers.log("应用运行中...");
      await helpers.sleep(5000);

      // 关闭应用
      helpers.log("关闭应用...");
      await helpers.execHdcShell(`am force-stop ${task.packageName}`);
      await helpers.sleep(2000);
    }

    helpers.log("\n压力测试完成");
  },
});

// 模板7：复杂交互流程（滑动、点击、输入）
registerScriptTemplate({
  id: "complex_interaction",
  name: "复杂交互流程",
  description: "执行复杂的用户交互操作序列",
  template: async (task, helpers) => {
    helpers.log(`启动应用: ${task.packageName}`);
    await helpers.execHdcShell(`am start -n ${task.packageName}/.MainActivity`);
    await helpers.sleep(3000);

    // 向下滑动
    helpers.log("向下滑动");
    await helpers.execHdcShell("input swipe 400 600 400 200 800");
    await helpers.sleep(2000);

    // 点击某个位置
    helpers.log("点击位置 (300, 500)");
    await helpers.execHdcShell("input tap 300 500");
    await helpers.sleep(2000);

    // 再次滑动
    helpers.log("向上滑动");
    await helpers.execHdcShell("input swipe 400 300 400 700 800");
    await helpers.sleep(2000);

    // 输入文本（如果焦点在输入框）
    helpers.log("输入文本");
    await helpers.execHdcShell('input text "test"');
    await helpers.sleep(1000);

    // 返回键
    helpers.log("按下返回键");
    await helpers.execHdcShell("input keyevent 4");
    await helpers.sleep(1500);

    helpers.log("交互流程完成");
  },
});

// 模板8：监控特定页面加载
registerScriptTemplate({
  id: "monitor_page_load",
  name: "监控页面加载性能",
  description: "打开特定页面，监控从启动到页面完全加载的性能数据",
  template: async (task, helpers) => {
    helpers.log(`启动应用并进入目标页面: ${task.packageName}`);

    // 启动应用
    await helpers.execHdcShell(`am start -n ${task.packageName}/.MainActivity`);
    await helpers.sleep(2000);

    // 点击进入目标页面（根据实际应用调整坐标）
    helpers.log("进入目标页面...");
    await helpers.execHdcShell("input tap 200 400");

    // 等待页面加载完成（可以通过检查特定UI元素或日志）
    helpers.log("等待页面加载...");
    await helpers.sleep(5000);

    // 执行一些操作确认页面已加载
    helpers.log("验证页面已加载");
    await helpers.execHdcShell("input swipe 400 600 400 300 500");
    await helpers.sleep(2000);

    helpers.log("页面加载监控完成");
  },
});
