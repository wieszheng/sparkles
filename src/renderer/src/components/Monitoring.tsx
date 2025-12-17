import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./styles.css";

interface AppPerformanceMetrics {
  packageName: string;
  timestamp: number;
  fps: number;
  fpsStability: number;
  appCpuUsage: number;
  appMemoryUsage: number;
  appMemoryPercent: number;
  gpuLoad: number;
  powerConsumption: number;
  networkUpSpeed: number;
  networkDownSpeed: number;
  deviceTemperature: number;
  performanceScore: {
    overall: number;
    fpsScore: number;
    cpuScore: number;
    memoryScore: number;
    temperatureScore: number;
    powerScore: number;
    grade: string;
  };
}

interface PerformanceAlert {
  timestamp: number;
  level: "warning" | "critical";
  type: string;
  message: string;
  value: number;
  threshold: number;
}

export function Monitoring() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [packageName, setPackageName] = useState("com.baidu.yiyan.ent");
  const [currentMetrics, setCurrentMetrics] =
    useState<AppPerformanceMetrics | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [maxDataPoints, setMaxDataPoints] = useState(60);
  const [statistics, setStatistics] = useState<any>(null);

  // 监控项配置
  const [monitorItems, setMonitorItems] = useState({
    fps: true,
    cpu: true,
    memory: true,
    gpu: true,
    power: true,
    temperature: true,
    network: true,
  });

  // 阈值配置
  const [thresholds, setThresholds] = useState({
    fpsWarning: 45,
    fpsCritical: 30,
    cpuWarning: 70,
    cpuCritical: 90,
    memoryWarning: 60,
    memoryCritical: 80,
    temperatureWarning: 42,
    temperatureCritical: 48,
    powerWarning: 3,
    powerCritical: 5,
  });

  // 设置IPC监听器
  useEffect(() => {
    // 监听数据
    window.api.onData((metrics: AppPerformanceMetrics) => {
      setCurrentMetrics(metrics);
      setHistoryData((prev) => {
        const newData = [
          ...prev,
          {
            time: new Date(metrics.timestamp).toLocaleTimeString(),
            timestamp: metrics.timestamp,
            fps: metrics.fps,
            cpu: metrics.appCpuUsage,
            memory: metrics.appMemoryUsage,
            gpu: metrics.gpuLoad,
            power: metrics.powerConsumption,
            temperature: metrics.deviceTemperature,
            networkUp: metrics.networkUpSpeed,
            networkDown: metrics.networkDownSpeed,
          },
        ];

        if (newData.length > maxDataPoints) {
          return newData.slice(-maxDataPoints);
        }
        return newData;
      });
    });

    // 监听告警
    window.api.onAlert((alert: PerformanceAlert) => {
      setAlerts((prev) => [{ ...alert, id: Date.now() }, ...prev].slice(0, 10));
    });

    // 监听错误
    window.api.onError((error: any) => {
      console.error("Monitor error:", error);
      alert(`监控错误: ${error.error}`);
    });

    return () => {
      window.api.removeListener("monitor:data");
      window.api.removeListener("monitor:alert");
      window.api.removeListener("monitor:error");
    };
  }, [maxDataPoints]);

  // 开始监控
  const handleStartMonitor = useCallback(async () => {
    if (!packageName.trim()) {
      alert("请输入包名");
      return;
    }

    setHistoryData([]);
    setAlerts([]);
    setStatistics(null);

    const result = await window.api.startMonitor(packageName, {
      interval: 1,
      thresholds,
      enableAlerts: true,
    });

    if (result.success) {
      setIsMonitoring(true);
    } else {
      alert(`启动监控失败: ${result.error}`);
    }
  }, [packageName, thresholds]);

  // 停止监控
  const handleStopMonitor = useCallback(async () => {
    const result = await window.api.stopMonitor();

    if (result.success) {
      setIsMonitoring(false);
      calculateStatistics();
    } else {
      alert(`停止监控失败: ${result.error}`);
    }
  }, [historyData]);

  // 计算统计数据
  const calculateStatistics = useCallback(() => {
    if (historyData.length === 0) return;

    const calc = (field: string) => {
      const values = historyData.map((d) => d[field]);
      return {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    };

    setStatistics({
      fps: calc("fps"),
      cpu: calc("cpu"),
      memory: calc("memory"),
      temperature: calc("temperature"),
      power: calc("power"),
    });
  }, [historyData]);

  // 导出数据
  const handleExportData = useCallback(async () => {
    const data = {
      packageName,
      startTime: historyData[0]?.timestamp,
      endTime: historyData[historyData.length - 1]?.timestamp,
      statistics,
      historyData,
      alerts,
    };

    // const result = await window.api.saveFile(data);
    //
    // if (result.success) {
    //   alert(`报告已保存到: ${result.path}`);
    // } else {
    //   alert("保存失败");
    // }
  }, [packageName, historyData, statistics, alerts]);

  // 单次采集
  const handleCollectOnce = useCallback(async () => {
    if (!packageName.trim()) {
      alert("请输入包名");
      return;
    }

    const result = await window.api.collectOnce({
      N: 1,
      PKG: packageName,
      cpu: true,
      gpu: true,
      fps: true,
      temperature: true,
      power: true,
      ram: true,
      net: true,
    });

    if (result.success) {
      console.log("采集结果:", result.data);
      alert("采集成功,查看控制台");
    } else {
      alert(`采集失败: ${result.error}`);
    }
  }, [packageName]);

  // 指标卡片组件
  const MetricCard: React.FC<{
    title: string;
    value: number | string;
    unit: string;
    color: string;
    threshold?: { warning: number; critical: number };
    current?: number;
  }> = ({ title, value, unit, color, threshold, current }) => {
    const isWarning = threshold && current && current > threshold.warning;
    const isCritical = threshold && current && current > threshold.critical;
    const statusColor = isCritical
      ? "bg-red-500"
      : isWarning
        ? "bg-yellow-500"
        : "bg-green-500";

    return (
      <div className="metric-card" style={{ borderLeftColor: color }}>
        <div className="metric-header">
          <span className="metric-title">{title}</span>
          {threshold && (
            <div className={`status-indicator ${statusColor}`}></div>
          )}
        </div>
        <div className="metric-value">
          {typeof value === "number" ? value.toFixed(1) : value || "--"}
          <span className="metric-unit">{unit}</span>
        </div>
      </div>
    );
  };

  // 图表渲染
  const renderChart = (
    dataKey: string,
    title: string,
    color: string,
    yAxisLabel: string,
  ) => {
    if (!monitorItems[dataKey as keyof typeof monitorItems]) return null;

    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* 头部 */}
      <div className="header-panel">
        <div className="header-content">
          <h1 className="app-title">应用性能实时监控</h1>
          <button
            className="config-button"
            onClick={() => setShowConfig(!showConfig)}
          >
            ⚙️ 配置
          </button>
        </div>

        {/* 配置面板 */}
        {showConfig && (
          <div className="config-panel">
            <h3 className="config-title">监控项配置</h3>
            <div className="config-grid">
              {Object.keys(monitorItems).map((key) => (
                <label key={key} className="config-item">
                  <input
                    type="checkbox"
                    checked={monitorItems[key as keyof typeof monitorItems]}
                    onChange={(e) =>
                      setMonitorItems({
                        ...monitorItems,
                        [key]: e.target.checked,
                      })
                    }
                  />
                  <span>{key.toUpperCase()}</span>
                </label>
              ))}
            </div>

            <h3 className="config-title">告警阈值</h3>
            <div className="threshold-grid">
              {Object.keys(thresholds).map((key) => (
                <div key={key} className="threshold-item">
                  <label>{key.replace(/([A-Z])/g, " $1").trim()}</label>
                  <input
                    type="number"
                    value={thresholds[key as keyof typeof thresholds]}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        [key]: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="datapoints-config">
              <label>历史数据点数</label>
              <input
                type="number"
                value={maxDataPoints}
                onChange={(e) => setMaxDataPoints(parseInt(e.target.value))}
                min="10"
                max="300"
              />
            </div>
          </div>
        )}

        {/* 控制区 */}
        <div className="control-bar">
          <input
            type="text"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            placeholder="输入应用包名"
            className="package-input"
            disabled={isMonitoring}
          />
          {!isMonitoring ? (
            <>
              <button className="btn btn-success" onClick={handleStartMonitor}>
                ▶️ 开始监控
              </button>
              <button className="btn btn-secondary" onClick={handleCollectOnce}>
                🔍 单次采集
              </button>
            </>
          ) : (
            <button className="btn btn-danger" onClick={handleStopMonitor}>
              ⏹️ 停止监控
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleExportData}
            disabled={historyData.length === 0}
          >
            💾 导出报告
          </button>
        </div>
      </div>

      {/* 实时指标 */}
      {currentMetrics && (
        <>
          <div className="metrics-grid">
            {monitorItems.fps && (
              <MetricCard
                title="FPS"
                value={currentMetrics.fps}
                unit="fps"
                color="#10b981"
                current={60 - currentMetrics.fps}
                threshold={{
                  warning: 60 - thresholds.fpsWarning,
                  critical: 60 - thresholds.fpsCritical,
                }}
              />
            )}
            {monitorItems.cpu && (
              <MetricCard
                title="CPU"
                value={currentMetrics.appCpuUsage}
                unit="%"
                color="#3b82f6"
                current={currentMetrics.appCpuUsage}
                threshold={{
                  warning: thresholds.cpuWarning,
                  critical: thresholds.cpuCritical,
                }}
              />
            )}
            {monitorItems.memory && (
              <MetricCard
                title="内存"
                value={currentMetrics.appMemoryUsage}
                unit="MB"
                color="#8b5cf6"
                current={currentMetrics.appMemoryPercent}
                threshold={{
                  warning: thresholds.memoryWarning,
                  critical: thresholds.memoryCritical,
                }}
              />
            )}
            {monitorItems.gpu && (
              <MetricCard
                title="GPU"
                value={currentMetrics.gpuLoad}
                unit="%"
                color="#f59e0b"
              />
            )}
            {monitorItems.power && (
              <MetricCard
                title="功耗"
                value={currentMetrics.powerConsumption}
                unit="W"
                color="#ef4444"
                current={currentMetrics.powerConsumption}
                threshold={{
                  warning: thresholds.powerWarning,
                  critical: thresholds.powerCritical,
                }}
              />
            )}
            {monitorItems.temperature && (
              <MetricCard
                title="温度"
                value={currentMetrics.deviceTemperature}
                unit="°C"
                color="#f97316"
                current={currentMetrics.deviceTemperature}
                threshold={{
                  warning: thresholds.temperatureWarning,
                  critical: thresholds.temperatureCritical,
                }}
              />
            )}
          </div>

          {/* 性能评分 */}
          <div className="score-panel">
            <h2>性能评分</h2>
            <div className="score-content">
              <div className="score-circle">
                <svg width="120" height="120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={
                      currentMetrics.performanceScore.grade === "Excellent"
                        ? "#10b981"
                        : currentMetrics.performanceScore.grade === "Good"
                          ? "#3b82f6"
                          : "#f59e0b"
                    }
                    strokeWidth="8"
                    strokeDasharray={`${currentMetrics.performanceScore.overall * 3.14} 314`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="score-value">
                  <div className="score-number">
                    {currentMetrics.performanceScore.overall}
                  </div>
                  <div className="score-grade">
                    {currentMetrics.performanceScore.grade}
                  </div>
                </div>
              </div>
              <div className="score-details">
                <div>FPS: {currentMetrics.performanceScore.fpsScore}</div>
                <div>CPU: {currentMetrics.performanceScore.cpuScore}</div>
                <div>内存: {currentMetrics.performanceScore.memoryScore}</div>
                <div>
                  温度: {currentMetrics.performanceScore.temperatureScore}
                </div>
                <div>功耗: {currentMetrics.performanceScore.powerScore}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 实时图表 */}
      {historyData.length > 0 && (
        <div className="charts-section">
          {renderChart("fps", "FPS (帧率)", "#10b981", "FPS")}
          {renderChart("cpu", "CPU 使用率", "#3b82f6", "%")}
          {renderChart("memory", "内存占用", "#8b5cf6", "MB")}
          {renderChart("gpu", "GPU 负载", "#f59e0b", "%")}
          {renderChart("power", "功耗", "#ef4444", "W")}
          {renderChart("temperature", "温度", "#f97316", "°C")}

          {monitorItems.network && (
            <div className="chart-container">
              <h3 className="chart-title">网络速率</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis
                    label={{
                      value: "KB/s",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="networkUp"
                    stroke="#06b6d4"
                    name="上行"
                  />
                  <Line
                    type="monotone"
                    dataKey="networkDown"
                    stroke="#14b8a6"
                    name="下行"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* 告警列表 */}
      {alerts.length > 0 && (
        <div className="alerts-panel">
          <h2>性能告警</h2>
          {alerts.map((alert: any) => (
            <div
              key={alert.id}
              className={`alert-item ${alert.level === "critical" ? "alert-critical" : "alert-warning"}`}
            >
              <span className="alert-icon">
                {alert.level === "critical" ? "🚨" : "⚠️"}
              </span>
              <span className="alert-message">{alert.message}</span>
              <span className="alert-time">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 统计摘要 */}
      {statistics && (
        <div className="statistics-panel">
          <h2>性能统计摘要</h2>
          <div className="statistics-grid">
            {Object.entries(statistics).map(([key, values]: [string, any]) => (
              <div key={key} className="stat-card">
                <h3>{key.toUpperCase()}</h3>
                <div className="stat-values">
                  <div>
                    <span>平均:</span> {values.avg.toFixed(2)}
                  </div>
                  <div>
                    <span>最小:</span> {values.min.toFixed(2)}
                  </div>
                  <div>
                    <span>最大:</span> {values.max.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
