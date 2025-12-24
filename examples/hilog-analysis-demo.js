/**
 * HiLog 日志分析示例脚本
 * 
 * 演示如何在性能监控任务中分析 HiLog 日志
 */

const fs = require('fs');
const path = require('path');

module.exports = async function (task, helpers) {
    helpers.log("=== HiLog 日志分析示例开始 ===");

    try {
        // ========== 1. 启动应用 ==========
        helpers.log("1. 启动应用");
        await helpers.launchApp(task.packageName);
        await helpers.sleep(3000);

        // ========== 2. 执行一些操作 ==========
        helpers.log("2. 执行应用操作");

        // 点击操作
        await helpers.uiClick(300, 500);
        await helpers.sleep(1000);

        // 滑动操作
        await helpers.uiDircFling(helpers.SwipeDirection.UP, 800);
        await helpers.sleep(2000);

        // 输入操作
        await helpers.uiClick(300, 300);
        await helpers.sleep(500);
        await helpers.uiText("test input");
        await helpers.sleep(1000);

        // ========== 3. 等待日志采集 ==========
        helpers.log("3. 等待日志采集（10秒）");
        await helpers.sleep(10000);

        // ========== 4. 日志分析说明 ==========
        helpers.log("4. 日志分析说明");
        helpers.log("  - HiLog 日志已自动采集");
        helpers.log("  - 日志保存位置：/tmp/sparkles-logs/");
        helpers.log(`  - 日志文件名：hilog_${task.packageName}_<timestamp>.log`);

        // 注意：在实际的 Node.js 环境中，可以使用以下代码分析日志
        // 但在脚本模板中，这些功能需要在主进程中实现

        helpers.log("\n日志分析功能（需在主进程中实现）：");
        helpers.log("  1. 解析日志文件");
        helpers.log("  2. 统计日志级别分布");
        helpers.log("  3. 提取错误和警告");
        helpers.log("  4. 按 Tag 分类");
        helpers.log("  5. 导出为 JSON/CSV");

        // ========== 5. 继续执行更多操作 ==========
        helpers.log("\n5. 继续执行更多操作");

        for (let i = 0; i < 3; i++) {
            helpers.log(`  - 第 ${i + 1} 次操作`);

            // 随机操作
            await helpers.uiClick(200 + i * 50, 400);
            await helpers.sleep(1000);

            await helpers.uiDircFling(helpers.SwipeDirection.UP, 600);
            await helpers.sleep(1500);

            // 检查是否中止
            if (helpers.isAborted()) {
                helpers.log("任务已中止");
                return;
            }
        }

        // ========== 6. 返回主页 ==========
        helpers.log("\n6. 返回主页");
        await helpers.uiGoHome();
        await helpers.sleep(1000);

        helpers.log("\n=== HiLog 日志分析示例完成 ===");
        helpers.log("\n提示：");
        helpers.log("  - 查看 /tmp/sparkles-logs/ 目录获取日志文件");
        helpers.log("  - 使用 hilog-utils 工具分析日志");
        helpers.log("  - 日志包含应用运行期间的所有系统和应用日志");

    } catch (error) {
        helpers.log(`脚本执行出错: ${error.message}`);
        throw error;
    }
};

/*
 * 日志分析示例代码（在主进程中使用）
 * 
 * import * as fs from 'fs';
 * import {
 *   parseHiLogLine,
 *   filterHiLogLines,
 *   getLogSummary,
 *   extractErrorLogs,
 *   exportLogsToJSON,
 *   exportLogsToCSV,
 * } from './hilog-utils';
 * 
 * // 读取日志文件
 * const logPath = '/tmp/sparkles-logs/hilog_com.example.app_2025-12-24.log';
 * const content = fs.readFileSync(logPath, 'utf-8');
 * const lines = content.split('\n');
 * 
 * // 解析日志
 * const parsedLogs = lines
 *   .map(parseHiLogLine)
 *   .filter(log => log !== null);
 * 
 * console.log(`解析了 ${parsedLogs.length} 条日志`);
 * 
 * // 获取日志摘要
 * const summary = getLogSummary(parsedLogs);
 * console.log('日志摘要:', summary);
 * // {
 * //   total: 1000,
 * //   byLevel: { D: 100, I: 500, W: 200, E: 150, F: 50 },
 * //   byTag: { "testTag": 500, "networkTag": 300, ... },
 * //   timeRange: { start: "...", end: "...", duration: 3600000 },
 * //   errorCount: 150,
 * //   warningCount: 200
 * // }
 * 
 * // 提取错误日志
 * const errors = extractErrorLogs(parsedLogs);
 * console.log(`发现 ${errors.length} 条错误日志`);
 * errors.forEach(error => {
 *   console.log(`[${error.time}] [${error.tag}] ${error.message}`);
 * });
 * 
 * // 过滤特定日志
 * const filtered = filterHiLogLines(lines, {
 *   level: [HiLogLevel.ERROR, HiLogLevel.FATAL],
 *   tag: ['crash', 'exception'],
 *   keyword: 'timeout',
 * });
 * console.log(`过滤后有 ${filtered.length} 条日志`);
 * 
 * // 导出为 JSON
 * const json = exportLogsToJSON(parsedLogs);
 * fs.writeFileSync('/tmp/logs.json', json);
 * 
 * // 导出为 CSV
 * const csv = exportLogsToCSV(parsedLogs);
 * fs.writeFileSync('/tmp/logs.csv', csv);
 * 
 * console.log('日志分析完成！');
 */
