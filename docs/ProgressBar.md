# ProgressBar 组件使用指南

基于 Dashboard 中选中样式实现的灵活进度条组件。

## 基础用法

```tsx
import { ProgressBar } from './ProgressBar';

// 基础进度条
<ProgressBar value={75} />

// 自定义样式
<ProgressBar 
  value={60}
  width="w-48"
  height="h-3"
  gradient="from-blue-500 to-purple-500"
  backgroundColor="bg-gray-700"
/>
```

## 预设样式

### DashboardProgressBar
基于原始 Dashboard 样式，支持悬停效果：
```tsx
import { DashboardProgressBar } from './ProgressBar';

<DashboardProgressBar value={67} />
```

### DownloadProgressBar
带标签和百分比的下载进度条：
```tsx
import { DownloadProgressBar } from './ProgressBar';

<DownloadProgressBar 
  value={89} 
  label="下载进度"
/>
```

### SmallProgressBar
小型进度条，适用于状态指示：
```tsx
import { SmallProgressBar } from './ProgressBar';

<SmallProgressBar value={45} />
```

### LargeProgressBar
大型进度条，带完整标签：
```tsx
import { LargeProgressBar } from './ProgressBar';

<LargeProgressBar 
  value={78} 
  label="上传进度"
/>
```

## 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `number` | - | 进度值 (0-100) |
| `width` | `string` | `'w-32'` | 宽度类名 |
| `height` | `string` | `'h-2'` | 高度类名 |
| `gradient` | `string` | `'from-rose-500 to-orange-500'` | 渐变色类名 |
| `backgroundColor` | `string` | `'bg-gray-800'` | 背景色类名 |
| `showLabel` | `boolean` | `false` | 是否显示标签 |
| `label` | `string` | - | 标签文本 |
| `showPercentage` | `boolean` | `false` | 是否显示百分比 |
| `animated` | `boolean` | `true` | 是否启用动画 |
| `hoverEffect` | `boolean` | `false` | 是否启用悬停效果 |
| `duration` | `number` | `300` | 动画持续时间 (ms) |
| `shimmer` | `boolean` | `false` | 是否启用闪光动画 |
| `className` | `string` | - | 额外的 CSS 类名 |

## 高级用法

### 带闪光效果的进度条
```tsx
<ProgressBar 
  value={75}
  shimmer={true}
  gradient="from-emerald-500 to-teal-500"
/>
```

### 悬停效果进度条
```tsx
<ProgressBar 
  value={60}
  hoverEffect={true}
  gradient="from-rose-500 to-orange-500"
/>
```

### 完整功能进度条
```tsx
<ProgressBar 
  value={85}
  width="w-full"
  height="h-3"
  showLabel={true}
  showPercentage={true}
  label="处理进度"
  animated={true}
  shimmer={true}
  gradient="from-purple-500 to-pink-500"
/>
```

## 样式定制

### 自定义渐变色
```tsx
// 彩虹渐变
<ProgressBar 
  value={70}
  gradient="from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"
/>

// 霓虹效果
<ProgressBar 
  value={80}
  gradient="from-cyan-400 to-blue-500"
  className="shadow-lg shadow-cyan-500/50"
/>
```

### 自定义尺寸
```tsx
// 超小进度条
<ProgressBar 
  value={50}
  width="w-16"
  height="h-1"
/>

// 超大进度条
<ProgressBar 
  value={90}
  width="w-full"
  height="h-4"
/>
```

## 动态更新示例

```tsx
import { useState, useEffect } from 'react';
import { ProgressBar } from './ProgressBar';

function DynamicProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => prev >= 100 ? 0 : prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <ProgressBar 
      value={progress}
      showLabel={true}
      showPercentage={true}
      label="自动进度"
    />
  );
}
```

## 注意事项

1. `value` 属性会自动限制在 0-100 范围内
2. 使用 `hoverEffect` 时，组件会自动包装在 `group` 容器中
3. `shimmer` 效果需要配合适当的渐变色使用
4. 所有动画基于 Framer Motion，确保项目中已安装该依赖
5. 样式基于 Tailwind CSS，确保相关类名可用