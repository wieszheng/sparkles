import { Cpu, HardDrive, Thermometer, Battery, Wifi } from "lucide-react";

export const generateChartData = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    value: Math.floor(Math.random() * 100) + 20,
  }));
};

export const mockScripts: ScriptFile[] = [
  {
    id: 1,
    name: "login-flow.ts",
    label: "登录流程",
    content: `// 登录流程自动化脚本
import { test, expect } from '@playwright/test';

test('用户登录流程', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', 'testuser');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});`,
    lastModified: "2024-11-20",
  },
  {
    id: 2,
    name: "payment-flow.ts",
    label: "支付功能",
    content: `// 支付流程自动化脚本
import { test, expect } from '@playwright/test';

test('支付流程测试', async ({ page }) => {
  await page.goto('/checkout');
  await page.fill('#card-number', '4242424242424242');
  await page.click('#submit-payment');
  await expect(page.locator('.success')).toBeVisible();
});`,
    lastModified: "2024-11-18",
  },
  {
    id: 3,
    name: "cart-flow.ts",
    label: "购物车流程",
    content: `// 购物车流程脚本
import { test, expect } from '@playwright/test';

test('添加商品到购物车', async ({ page }) => {
  await page.goto('/products');
  await page.click('.add-to-cart');
  await expect(page.locator('.cart-count')).toHaveText('1');
});`,
    lastModified: "2024-11-15",
  },
];

export const mockApps = [
  { id: 1, name: "Web App", label: "Web App" },
  { id: 2, name: "Mobile App", label: "Mobile App" },
  { id: 3, name: "Admin Panel", label: "Admin Panel" },
];

export const mockMonitoringTasks: MonitoringTask[] = [
  {
    id: 1,
    name: "登录流程监控",
    script: "login-flow.ts",
    app: "Web App",
    status: "completed",
    createdAt: "2024-11-15",
    deprecated: false,
    reportData: true,
    startTime: "2024-11-15 10:00",
    endTime: "2024-11-15 12:00",
    data: {
      cpu: generateChartData(),
      memory: generateChartData(),
      temperature: generateChartData(),
      battery: generateChartData(),
      traffic: generateChartData(),
    },
  },
  {
    id: 2,
    name: "支付功能监控",
    script: "payment-flow.ts",
    app: "Web App",
    status: "running",
    createdAt: "2024-11-18",
    deprecated: false,
    reportData: true,
    startTime: "2024-11-18 14:00",
    data: {
      cpu: generateChartData(),
      memory: generateChartData(),
      temperature: generateChartData(),
      battery: generateChartData(),
      traffic: generateChartData(),
    },
  },
  {
    id: 3,
    name: "购物车测试",
    script: "cart-flow.ts",
    app: "Mobile App",
    status: "pending",
    createdAt: "2024-11-20",
    deprecated: false,
    reportData: false,
  },
];

export const monitorMetrics: MonitorMetric[] = [
  { key: "cpu", label: "CPU 使用率", icon: Cpu, color: "#3b82f6", unit: "%" },
  {
    key: "memory",
    label: "内存使用率",
    icon: HardDrive,
    color: "#10b981",
    unit: "%",
  },
  {
    key: "temperature",
    label: "温度",
    icon: Thermometer,
    color: "#f59e0b",
    unit: "°C",
  },
  { key: "battery", label: "电量", icon: Battery, color: "#8b5cf6", unit: "%" },
  {
    key: "traffic",
    label: "网络流量",
    icon: Wifi,
    color: "#ec4899",
    unit: "MB/s",
  },
];
