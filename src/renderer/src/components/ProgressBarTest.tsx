import { DashboardProgressBar, ProgressBar } from "./ProgressBar";

export function ProgressBarTest() {
  return (
    <div className="p-8 space-y-8 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-white">进度条测试</h1>

      {/* 测试类型修复 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">类型修复测试</h2>
        <div className="space-y-3">
          {/* 这些应该不再有类型错误 */}
          <DashboardProgressBar />
          <DashboardProgressBar value={50} />
          <ProgressBar />
          <ProgressBar value={75} />
        </div>
      </section>

      {/* 测试悬停效果 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">悬停效果测试</h2>
        <div className="space-y-4">
          <div className="p-4 border border-gray-700 rounded-lg">
            <p className="text-sm text-gray-300 mb-2">
              悬停下面的进度条看效果：
            </p>
            <DashboardProgressBar value={67} />
          </div>

          <div className="p-4 border border-gray-700 rounded-lg">
            <p className="text-sm text-gray-300 mb-2">自定义悬停效果：</p>
            <ProgressBar
              value={45}
              hoverEffect={true}
              gradient="from-blue-500 to-purple-500"
              width="w-48"
              height="h-3"
            />
          </div>

          <div className="p-4 border border-gray-700 rounded-lg">
            <p className="text-sm text-gray-300 mb-2">无悬停效果（对比）：</p>
            <ProgressBar
              value={67}
              hoverEffect={false}
              gradient="from-rose-500 to-orange-500"
              width="w-32"
              height="h-2"
            />
          </div>
        </div>
      </section>

      {/* 测试各种配置 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">功能测试</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">带标签和百分比：</p>
              <ProgressBar
                value={85}
                showLabel={true}
                showPercentage={true}
                label="下载进度"
                width="w-full"
              />
            </div>

            <div className="p-4 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">闪光效果：</p>
              <ProgressBar
                value={70}
                shimmer={true}
                gradient="from-emerald-500 to-teal-500"
                width="w-full"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
