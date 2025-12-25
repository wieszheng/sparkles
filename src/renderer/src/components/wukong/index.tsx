import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Copy,
  Terminal,
  Shuffle,
  Target,
  Focus,
  Settings,
  Monitor,
  Smartphone,
  Percent,
  FileText,
  CheckCircle2,
  Info,
  Zap,
  MousePointer,
  Move,
  Keyboard,
  RotateCcw,
  Component,
  Circle,
  Hand,
} from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

// 随机测试配置
interface RandomTestConfig {
  seed: string;
  count: string;
  interval: string;
  time: string;
  useTime: boolean;
  bundle: string;
  prohibit: string;
  page: string;
  allowAbility: string;
  blockAbility: string;
  blockCompId: string;
  blockCompType: string;
  screenshot: boolean;
  checkBWScreen: boolean;
  uri: string;
  uriType: string;
  // 事件比例
  appswitch: number;
  touch: number;
  swap: number;
  mouse: number;
  keyboard: number;
  hardkey: number;
  rotate: number;
  component: number;
}

// 专项测试配置
interface SpecialTestConfig {
  count: string;
  interval: string;
  time: string;
  useTime: boolean;
  bundle: string;
  // 测试类型
  testType: "touch" | "swap" | "insomnia" | "component" | "record" | "replay";
  // 点击坐标
  touchX: string;
  touchY: string;
  // 滑动配置
  swapStartX: string;
  swapStartY: string;
  swapEndX: string;
  swapEndY: string;
  bilateral: boolean;
  // 录制回放
  recordFile: string;
  replayFile: string;
  screenshot: boolean;
  uitest: boolean;
}

// 专注测试配置
interface FocusTestConfig {
  seed: string;
  count: string;
  interval: string;
  time: string;
  useTime: boolean;
  bundle: string;
  prohibit: string;
  page: string;
  allowAbility: string;
  blockAbility: string;
  blockCompId: string;
  blockCompType: string;
  screenshot: boolean;
  checkBWScreen: boolean;
  numberFocus: string;
  focusTypes: string;
  // 事件比例
  appswitch: number;
  touch: number;
  swap: number;
  mouse: number;
  keyboard: number;
  hardkey: number;
  rotate: number;
  component: number;
}

const defaultRandomConfig: RandomTestConfig = {
  seed: "",
  count: "100",
  interval: "1500",
  time: "10",
  useTime: false,
  bundle: "",
  prohibit: "",
  page: "",
  allowAbility: "",
  blockAbility: "",
  blockCompId: "",
  blockCompType: "",
  screenshot: false,
  checkBWScreen: false,
  uri: "",
  uriType: "",
  appswitch: 10,
  touch: 10,
  swap: 3,
  mouse: 1,
  keyboard: 2,
  hardkey: 2,
  rotate: 2,
  component: 70,
};

const defaultSpecialConfig: SpecialTestConfig = {
  count: "10",
  interval: "1500",
  time: "10",
  useTime: false,
  bundle: "",
  testType: "touch",
  touchX: "",
  touchY: "",
  swapStartX: "",
  swapStartY: "",
  swapEndX: "",
  swapEndY: "",
  bilateral: false,
  recordFile: "",
  replayFile: "",
  screenshot: false,
  uitest: false,
};

const defaultFocusConfig: FocusTestConfig = {
  seed: "",
  count: "100",
  interval: "1500",
  time: "10",
  useTime: false,
  bundle: "",
  prohibit: "",
  page: "",
  allowAbility: "",
  blockAbility: "",
  blockCompId: "",
  blockCompType: "",
  screenshot: false,
  checkBWScreen: false,
  numberFocus: "",
  focusTypes: "",
  appswitch: 10,
  touch: 10,
  swap: 3,
  mouse: 1,
  keyboard: 2,
  hardkey: 2,
  rotate: 2,
  component: 70,
};

export function WukongTest() {
  const [activeTab, setActiveTab] = useState("random");
  const [randomConfig, setRandomConfig] =
    useState<RandomTestConfig>(defaultRandomConfig);
  const [specialConfig, setSpecialConfig] =
    useState<SpecialTestConfig>(defaultSpecialConfig);
  const [focusConfig, setFocusConfig] =
    useState<FocusTestConfig>(defaultFocusConfig);
  const [copied, setCopied] = useState(false);

  // 生成随机测试命令
  const generateRandomCommand = () => {
    let cmd = "wukong exec";
    if (randomConfig.seed) cmd += ` -s ${randomConfig.seed}`;
    if (randomConfig.interval) cmd += ` -i ${randomConfig.interval}`;
    if (randomConfig.useTime && randomConfig.time) {
      cmd += ` -T ${randomConfig.time}`;
    } else if (randomConfig.count) {
      cmd += ` -c ${randomConfig.count}`;
    }
    if (randomConfig.bundle) cmd += ` -b ${randomConfig.bundle}`;
    if (randomConfig.prohibit) cmd += ` -p ${randomConfig.prohibit}`;
    if (randomConfig.page) cmd += ` -d ${randomConfig.page}`;
    if (randomConfig.allowAbility) cmd += ` -e ${randomConfig.allowAbility}`;
    if (randomConfig.blockAbility) cmd += ` -E ${randomConfig.blockAbility}`;
    if (randomConfig.blockCompId) cmd += ` -Y ${randomConfig.blockCompId}`;
    if (randomConfig.blockCompType) cmd += ` -y ${randomConfig.blockCompType}`;
    if (randomConfig.uri) cmd += ` -U ${randomConfig.uri}`;
    if (randomConfig.uriType) cmd += ` -x ${randomConfig.uriType}`;
    if (randomConfig.screenshot) cmd += ` -I`;
    if (randomConfig.checkBWScreen) cmd += ` -B`;
    // 事件比例
    cmd += ` -a ${(randomConfig.appswitch / 100).toFixed(2)}`;
    cmd += ` -t ${(randomConfig.touch / 100).toFixed(2)}`;
    cmd += ` -S ${(randomConfig.swap / 100).toFixed(2)}`;
    cmd += ` -m ${(randomConfig.mouse / 100).toFixed(2)}`;
    cmd += ` -k ${(randomConfig.keyboard / 100).toFixed(2)}`;
    cmd += ` -H ${(randomConfig.hardkey / 100).toFixed(2)}`;
    cmd += ` -r ${(randomConfig.rotate / 100).toFixed(2)}`;
    cmd += ` -C ${(randomConfig.component / 100).toFixed(2)}`;
    return cmd;
  };

  // 生成专项测试命令
  const generateSpecialCommand = () => {
    let cmd = "wukong special";
    if (specialConfig.useTime && specialConfig.time) {
      cmd += ` -T ${specialConfig.time}`;
    } else if (specialConfig.count) {
      cmd += ` -c ${specialConfig.count}`;
    }
    if (specialConfig.interval) cmd += ` -i ${specialConfig.interval}`;

    switch (specialConfig.testType) {
      case "touch":
        if (specialConfig.touchX && specialConfig.touchY) {
          cmd += ` -t[${specialConfig.touchX},${specialConfig.touchY}]`;
        }
        break;
      case "swap":
        cmd += ` -S`;
        if (specialConfig.swapStartX && specialConfig.swapStartY) {
          cmd += ` -s[${specialConfig.swapStartX},${specialConfig.swapStartY}]`;
        }
        if (specialConfig.swapEndX && specialConfig.swapEndY) {
          cmd += ` -e[${specialConfig.swapEndX},${specialConfig.swapEndY}]`;
        }
        if (specialConfig.bilateral) cmd += ` -b`;
        break;
      case "insomnia":
        cmd += ` -k`;
        break;
      case "component":
        if (specialConfig.bundle) cmd += ` -C ${specialConfig.bundle}`;
        if (specialConfig.screenshot) cmd += ` -p`;
        break;
      case "record":
        if (specialConfig.recordFile) cmd += ` -r ${specialConfig.recordFile}`;
        break;
      case "replay":
        if (specialConfig.replayFile) cmd += ` -R ${specialConfig.replayFile}`;
        break;
    }
    if (specialConfig.uitest) cmd += ` -u`;
    return cmd;
  };

  // 生成专注测试命令
  const generateFocusCommand = () => {
    let cmd = "wukong focus";
    if (focusConfig.seed) cmd += ` -s ${focusConfig.seed}`;
    if (focusConfig.interval) cmd += ` -i ${focusConfig.interval}`;
    if (focusConfig.useTime && focusConfig.time) {
      cmd += ` -T ${focusConfig.time}`;
    } else if (focusConfig.count) {
      cmd += ` -c ${focusConfig.count}`;
    }
    if (focusConfig.numberFocus) cmd += ` -n ${focusConfig.numberFocus}`;
    if (focusConfig.focusTypes) cmd += ` -f ${focusConfig.focusTypes}`;
    if (focusConfig.bundle) cmd += ` -b ${focusConfig.bundle}`;
    if (focusConfig.prohibit) cmd += ` -p ${focusConfig.prohibit}`;
    if (focusConfig.page) cmd += ` -d ${focusConfig.page}`;
    if (focusConfig.allowAbility) cmd += ` -e ${focusConfig.allowAbility}`;
    if (focusConfig.blockAbility) cmd += ` -E ${focusConfig.blockAbility}`;
    if (focusConfig.blockCompId) cmd += ` -Y ${focusConfig.blockCompId}`;
    if (focusConfig.blockCompType) cmd += ` -y ${focusConfig.blockCompType}`;
    if (focusConfig.screenshot) cmd += ` -I`;
    if (focusConfig.checkBWScreen) cmd += ` -B`;
    // 事件比例
    cmd += ` -a ${(focusConfig.appswitch / 100).toFixed(2)}`;
    cmd += ` -t ${(focusConfig.touch / 100).toFixed(2)}`;
    cmd += ` -S ${(focusConfig.swap / 100).toFixed(2)}`;
    cmd += ` -m ${(focusConfig.mouse / 100).toFixed(2)}`;
    cmd += ` -k ${(focusConfig.keyboard / 100).toFixed(2)}`;
    cmd += ` -H ${(focusConfig.hardkey / 100).toFixed(2)}`;
    cmd += ` -r ${(focusConfig.rotate / 100).toFixed(2)}`;
    cmd += ` -C ${(focusConfig.component / 100).toFixed(2)}`;
    return cmd;
  };

  const getCurrentCommand = () => {
    switch (activeTab) {
      case "random":
        return generateRandomCommand();
      case "special":
        return generateSpecialCommand();
      case "focus":
        return generateFocusCommand();
      default:
        return "";
    }
  };

  const copyCommand = () => {
    navigator.clipboard.writeText(getCurrentCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetConfig = () => {
    switch (activeTab) {
      case "random":
        setRandomConfig(defaultRandomConfig);
        break;
      case "special":
        setSpecialConfig(defaultSpecialConfig);
        break;
      case "focus":
        setFocusConfig(defaultFocusConfig);
        break;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* 主内容 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧配置区 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-col flex-1"
            >
              <div className="px-2 pt-4 border-b border-border/40 bg-muted/20">
                <TabsList className="h-9 bg-muted/50">
                  <TabsTrigger
                    value="random"
                    className="text-xs gap-1.5 data-[state=active]:bg-background"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    随机测试
                  </TabsTrigger>
                  <TabsTrigger
                    value="special"
                    className="text-xs gap-1.5 data-[state=active]:bg-background"
                  >
                    <Target className="w-3.5 h-3.5" />
                    专项测试
                  </TabsTrigger>
                  <TabsTrigger
                    value="focus"
                    className="text-xs gap-1.5 data-[state=active]:bg-background"
                  >
                    <Focus className="w-3.5 h-3.5" />
                    专注测试
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                {/* 随机测试 */}
                <TabsContent value="random" className="m-0 p-2">
                  <div className="space-y-6">
                    {/* 基础配置 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">基础配置</h3>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            随机种子 (-s)
                          </Label>
                          <Input
                            placeholder="可选"
                            value={randomConfig.seed}
                            onChange={(e) =>
                              setRandomConfig({
                                ...randomConfig,
                                seed: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            执行间隔 (-i)
                          </Label>
                          <div className="relative">
                            <Input
                              placeholder="1500"
                              value={randomConfig.interval}
                              onChange={(e) =>
                                setRandomConfig({
                                  ...randomConfig,
                                  interval: e.target.value,
                                })
                              }
                              className="h-8 text-xs pr-8"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              ms
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">
                              {randomConfig.useTime
                                ? "测试时间 (-T)"
                                : "执行次数 (-c)"}
                            </Label>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">
                                次数
                              </span>
                              <Switch
                                checked={randomConfig.useTime}
                                onCheckedChange={(checked) =>
                                  setRandomConfig({
                                    ...randomConfig,
                                    useTime: checked,
                                  })
                                }
                                className="scale-75"
                              />
                              <span className="text-[10px] text-muted-foreground">
                                时间
                              </span>
                            </div>
                          </div>
                          <div className="relative">
                            <Input
                              placeholder={randomConfig.useTime ? "10" : "100"}
                              value={
                                randomConfig.useTime
                                  ? randomConfig.time
                                  : randomConfig.count
                              }
                              onChange={(e) =>
                                setRandomConfig({
                                  ...randomConfig,
                                  [randomConfig.useTime ? "time" : "count"]:
                                    e.target.value,
                                })
                              }
                              className="h-8 text-xs pr-10"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              {randomConfig.useTime ? "分钟" : "次"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* 应用配置 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">应用配置</h3>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            允许应用 (-b)
                          </Label>
                          <Input
                            placeholder="com.example.app1,com.example.app2"
                            value={randomConfig.bundle}
                            onChange={(e) =>
                              setRandomConfig({
                                ...randomConfig,
                                bundle: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            禁止应用 (-p)
                          </Label>
                          <Input
                            placeholder="com.example.app3"
                            value={randomConfig.prohibit}
                            onChange={(e) =>
                              setRandomConfig({
                                ...randomConfig,
                                prohibit: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            允许 Ability (-e)
                          </Label>
                          <Input
                            placeholder="com.example.MainAbility"
                            value={randomConfig.allowAbility}
                            onChange={(e) =>
                              setRandomConfig({
                                ...randomConfig,
                                allowAbility: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            禁止 Ability (-E)
                          </Label>
                          <Input
                            placeholder="com.example.AppInfoAbility"
                            value={randomConfig.blockAbility}
                            onChange={(e) =>
                              setRandomConfig({
                                ...randomConfig,
                                blockAbility: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            禁止页面 (-d)
                          </Label>
                          <Input
                            placeholder="pages/system"
                            value={randomConfig.page}
                            onChange={(e) =>
                              setRandomConfig({
                                ...randomConfig,
                                page: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            URI 页面 (-U)
                          </Label>
                          <Input
                            placeholder="可选"
                            value={randomConfig.uri}
                            onChange={(e) =>
                              setRandomConfig({
                                ...randomConfig,
                                uri: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* 事件比例 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">事件比例</h3>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          {
                            key: "component",
                            label: "控件测试",
                            icon: Component,
                            color: "text-blue-500",
                          },
                          {
                            key: "touch",
                            label: "触摸测试",
                            icon: Hand,
                            color: "text-green-500",
                          },
                          {
                            key: "appswitch",
                            label: "应用切换",
                            icon: Monitor,
                            color: "text-purple-500",
                          },
                          {
                            key: "swap",
                            label: "滑动测试",
                            icon: Move,
                            color: "text-orange-500",
                          },
                          {
                            key: "keyboard",
                            label: "键盘测试",
                            icon: Keyboard,
                            color: "text-cyan-500",
                          },
                          {
                            key: "hardkey",
                            label: "物理按键",
                            icon: Circle,
                            color: "text-pink-500",
                          },
                          {
                            key: "rotate",
                            label: "屏幕旋转",
                            icon: RotateCcw,
                            color: "text-amber-500",
                          },
                          {
                            key: "mouse",
                            label: "鼠标测试",
                            icon: MousePointer,
                            color: "text-indigo-500",
                          },
                        ].map((item) => (
                          <div key={item.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <item.icon
                                  className={`w-3 h-3 ${item.color}`}
                                />
                                <Label className="text-xs">{item.label}</Label>
                              </div>
                              <span className="text-xs font-medium">
                                {
                                  randomConfig[
                                    item.key as keyof RandomTestConfig
                                  ]
                                }
                                %
                              </span>
                            </div>
                            <Slider
                              value={[
                                randomConfig[
                                  item.key as keyof RandomTestConfig
                                ] as number,
                              ]}
                              onValueChange={([value]) =>
                                setRandomConfig({
                                  ...randomConfig,
                                  [item.key]: value,
                                })
                              }
                              max={100}
                              step={1}
                              className="h-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* 高级选项 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">高级选项</h3>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={randomConfig.screenshot}
                            onCheckedChange={(checked) =>
                              setRandomConfig({
                                ...randomConfig,
                                screenshot: checked,
                              })
                            }
                          />
                          <Label className="text-xs">截图 (-I)</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={randomConfig.checkBWScreen}
                            onCheckedChange={(checked) =>
                              setRandomConfig({
                                ...randomConfig,
                                checkBWScreen: checked,
                              })
                            }
                          />
                          <Label className="text-xs">黑白屏检测 (-B)</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* 专项测试 */}
                <TabsContent value="special" className="m-0 p-6">
                  <div className="space-y-6">
                    {/* 测试类型 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">测试类型</h3>
                      </div>
                      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                        {[
                          { value: "touch", label: "点击测试", icon: Hand },
                          { value: "swap", label: "滑动测试", icon: Move },
                          {
                            value: "insomnia",
                            label: "休眠唤醒",
                            icon: Monitor,
                          },
                          {
                            value: "component",
                            label: "控件遍历",
                            icon: Component,
                          },
                          { value: "record", label: "操作录制", icon: Circle },
                          { value: "replay", label: "操作回放", icon: Play },
                        ].map((item) => (
                          <button
                            key={item.value}
                            onClick={() =>
                              setSpecialConfig({
                                ...specialConfig,
                                testType:
                                  item.value as SpecialTestConfig["testType"],
                              })
                            }
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                              specialConfig.testType === item.value
                                ? "border-orange-500 bg-orange-500/10 text-orange-500"
                                : "border-border hover:border-muted-foreground/50"
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span className="text-xs">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* 基础配置 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">基础配置</h3>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            执行间隔 (-i)
                          </Label>
                          <div className="relative">
                            <Input
                              placeholder="1500"
                              value={specialConfig.interval}
                              onChange={(e) =>
                                setSpecialConfig({
                                  ...specialConfig,
                                  interval: e.target.value,
                                })
                              }
                              className="h-8 text-xs pr-8"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              ms
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">
                              {specialConfig.useTime
                                ? "测试时间 (-T)"
                                : "执行次数 (-c)"}
                            </Label>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">
                                次数
                              </span>
                              <Switch
                                checked={specialConfig.useTime}
                                onCheckedChange={(checked) =>
                                  setSpecialConfig({
                                    ...specialConfig,
                                    useTime: checked,
                                  })
                                }
                                className="scale-75"
                              />
                              <span className="text-[10px] text-muted-foreground">
                                时间
                              </span>
                            </div>
                          </div>
                          <div className="relative">
                            <Input
                              placeholder={specialConfig.useTime ? "10" : "10"}
                              value={
                                specialConfig.useTime
                                  ? specialConfig.time
                                  : specialConfig.count
                              }
                              onChange={(e) =>
                                setSpecialConfig({
                                  ...specialConfig,
                                  [specialConfig.useTime ? "time" : "count"]:
                                    e.target.value,
                                })
                              }
                              className="h-8 text-xs pr-10"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              {specialConfig.useTime ? "分钟" : "次"}
                            </span>
                          </div>
                        </div>
                        {specialConfig.testType === "component" && (
                          <div className="space-y-2 col-span-2">
                            <Label className="text-xs text-muted-foreground">
                              应用包名 (-C)
                            </Label>
                            <Input
                              placeholder="com.example.app"
                              value={specialConfig.bundle}
                              onChange={(e) =>
                                setSpecialConfig({
                                  ...specialConfig,
                                  bundle: e.target.value,
                                })
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 点击测试配置 */}
                    {specialConfig.testType === "touch" && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Hand className="w-4 h-4 text-muted-foreground" />
                            <h3 className="text-sm font-medium">点击坐标</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                X 坐标
                              </Label>
                              <Input
                                placeholder="100"
                                value={specialConfig.touchX}
                                onChange={(e) =>
                                  setSpecialConfig({
                                    ...specialConfig,
                                    touchX: e.target.value,
                                  })
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                Y 坐标
                              </Label>
                              <Input
                                placeholder="200"
                                value={specialConfig.touchY}
                                onChange={(e) =>
                                  setSpecialConfig({
                                    ...specialConfig,
                                    touchY: e.target.value,
                                  })
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* 滑动测试配置 */}
                    {specialConfig.testType === "swap" && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Move className="w-4 h-4 text-muted-foreground" />
                            <h3 className="text-sm font-medium">滑动配置</h3>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                起点 X
                              </Label>
                              <Input
                                placeholder="100"
                                value={specialConfig.swapStartX}
                                onChange={(e) =>
                                  setSpecialConfig({
                                    ...specialConfig,
                                    swapStartX: e.target.value,
                                  })
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                起点 Y
                              </Label>
                              <Input
                                placeholder="200"
                                value={specialConfig.swapStartY}
                                onChange={(e) =>
                                  setSpecialConfig({
                                    ...specialConfig,
                                    swapStartY: e.target.value,
                                  })
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                终点 X
                              </Label>
                              <Input
                                placeholder="100"
                                value={specialConfig.swapEndX}
                                onChange={(e) =>
                                  setSpecialConfig({
                                    ...specialConfig,
                                    swapEndX: e.target.value,
                                  })
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                终点 Y
                              </Label>
                              <Input
                                placeholder="800"
                                value={specialConfig.swapEndY}
                                onChange={(e) =>
                                  setSpecialConfig({
                                    ...specialConfig,
                                    swapEndY: e.target.value,
                                  })
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={specialConfig.bilateral}
                              onCheckedChange={(checked) =>
                                setSpecialConfig({
                                  ...specialConfig,
                                  bilateral: checked,
                                })
                              }
                            />
                            <Label className="text-xs">往返滑动 (-b)</Label>
                          </div>
                        </div>
                      </>
                    )}

                    {/* 录制回放配置 */}
                    {(specialConfig.testType === "record" ||
                      specialConfig.testType === "replay") && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <h3 className="text-sm font-medium">
                              {specialConfig.testType === "record"
                                ? "录制配置"
                                : "回放配置"}
                            </h3>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              {specialConfig.testType === "record"
                                ? "录制文件路径 (-r)"
                                : "回放文件路径 (-R)"}
                            </Label>
                            <Input
                              placeholder="/data/local/tmp/record.json"
                              value={
                                specialConfig.testType === "record"
                                  ? specialConfig.recordFile
                                  : specialConfig.replayFile
                              }
                              onChange={(e) =>
                                setSpecialConfig({
                                  ...specialConfig,
                                  [specialConfig.testType === "record"
                                    ? "recordFile"
                                    : "replayFile"]: e.target.value,
                                })
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />

                    {/* 高级选项 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">高级选项</h3>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={specialConfig.screenshot}
                            onCheckedChange={(checked) =>
                              setSpecialConfig({
                                ...specialConfig,
                                screenshot: checked,
                              })
                            }
                          />
                          <Label className="text-xs">截图 (-p)</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={specialConfig.uitest}
                            onCheckedChange={(checked) =>
                              setSpecialConfig({
                                ...specialConfig,
                                uitest: checked,
                              })
                            }
                          />
                          <Label className="text-xs">UITest 布局 (-u)</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* 专注测试 */}
                <TabsContent value="focus" className="m-0 p-6">
                  <div className="space-y-6">
                    {/* 专注配置 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Focus className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">专注配置</h3>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            每控件注入次数 (-n)
                          </Label>
                          <Input
                            placeholder="可选"
                            value={focusConfig.numberFocus}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                numberFocus: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-2 col-span-2 lg:col-span-3">
                          <Label className="text-xs text-muted-foreground">
                            专注控件类型 (-f)
                          </Label>
                          <Input
                            placeholder="Button,Text,Image (用英文逗号分隔)"
                            value={focusConfig.focusTypes}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                focusTypes: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* 基础配置 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">基础配置</h3>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            随机种子 (-s)
                          </Label>
                          <Input
                            placeholder="可选"
                            value={focusConfig.seed}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                seed: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            执行间隔 (-i)
                          </Label>
                          <div className="relative">
                            <Input
                              placeholder="1500"
                              value={focusConfig.interval}
                              onChange={(e) =>
                                setFocusConfig({
                                  ...focusConfig,
                                  interval: e.target.value,
                                })
                              }
                              className="h-8 text-xs pr-8"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              ms
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">
                              {focusConfig.useTime
                                ? "测试时间 (-T)"
                                : "执行次数 (-c)"}
                            </Label>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">
                                次数
                              </span>
                              <Switch
                                checked={focusConfig.useTime}
                                onCheckedChange={(checked) =>
                                  setFocusConfig({
                                    ...focusConfig,
                                    useTime: checked,
                                  })
                                }
                                className="scale-75"
                              />
                              <span className="text-[10px] text-muted-foreground">
                                时间
                              </span>
                            </div>
                          </div>
                          <div className="relative">
                            <Input
                              placeholder={focusConfig.useTime ? "10" : "100"}
                              value={
                                focusConfig.useTime
                                  ? focusConfig.time
                                  : focusConfig.count
                              }
                              onChange={(e) =>
                                setFocusConfig({
                                  ...focusConfig,
                                  [focusConfig.useTime ? "time" : "count"]:
                                    e.target.value,
                                })
                              }
                              className="h-8 text-xs pr-10"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              {focusConfig.useTime ? "分钟" : "次"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* 应用配置 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">应用配置</h3>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            允许应用 (-b)
                          </Label>
                          <Input
                            placeholder="com.example.app1,com.example.app2"
                            value={focusConfig.bundle}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                bundle: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            禁止应用 (-p)
                          </Label>
                          <Input
                            placeholder="com.example.app3"
                            value={focusConfig.prohibit}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                prohibit: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            允许 Ability (-e)
                          </Label>
                          <Input
                            placeholder="com.example.MainAbility"
                            value={focusConfig.allowAbility}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                allowAbility: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            禁止 Ability (-E)
                          </Label>
                          <Input
                            placeholder="com.example.AppInfoAbility"
                            value={focusConfig.blockAbility}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                blockAbility: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* 事件比例 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">事件比例</h3>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          {
                            key: "component",
                            label: "控件测试",
                            icon: Component,
                            color: "text-blue-500",
                          },
                          {
                            key: "touch",
                            label: "触摸测试",
                            icon: Hand,
                            color: "text-green-500",
                          },
                          {
                            key: "appswitch",
                            label: "应用切换",
                            icon: Monitor,
                            color: "text-purple-500",
                          },
                          {
                            key: "swap",
                            label: "滑动测试",
                            icon: Move,
                            color: "text-orange-500",
                          },
                          {
                            key: "keyboard",
                            label: "键盘测试",
                            icon: Keyboard,
                            color: "text-cyan-500",
                          },
                          {
                            key: "hardkey",
                            label: "物理按键",
                            icon: Circle,
                            color: "text-pink-500",
                          },
                          {
                            key: "rotate",
                            label: "屏幕旋转",
                            icon: RotateCcw,
                            color: "text-amber-500",
                          },
                          {
                            key: "mouse",
                            label: "鼠标测试",
                            icon: MousePointer,
                            color: "text-indigo-500",
                          },
                        ].map((item) => (
                          <div key={item.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <item.icon
                                  className={`w-3 h-3 ${item.color}`}
                                />
                                <Label className="text-xs">{item.label}</Label>
                              </div>
                              <span className="text-xs font-medium">
                                {focusConfig[item.key as keyof FocusTestConfig]}
                                %
                              </span>
                            </div>
                            <Slider
                              value={[
                                focusConfig[
                                  item.key as keyof FocusTestConfig
                                ] as number,
                              ]}
                              onValueChange={([value]) =>
                                setFocusConfig({
                                  ...focusConfig,
                                  [item.key]: value,
                                })
                              }
                              max={100}
                              step={1}
                              className="h-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* 高级选项 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">高级选项</h3>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={focusConfig.screenshot}
                            onCheckedChange={(checked) =>
                              setFocusConfig({
                                ...focusConfig,
                                screenshot: checked,
                              })
                            }
                          />
                          <Label className="text-xs">截图 (-I)</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={focusConfig.checkBWScreen}
                            onCheckedChange={(checked) =>
                              setFocusConfig({
                                ...focusConfig,
                                checkBWScreen: checked,
                              })
                            }
                          />
                          <Label className="text-xs">黑白屏检测 (-B)</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* 右侧命令预览 */}
          <div className="w-80 lg:w-96 border-l border-border/40 flex flex-col bg-muted/20">
            <div className="px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">命令预览</h3>
              </div>
            </div>
            <div className="flex-1 p-4">
              <div className="relative h-full">
                <div className="absolute inset-0 rounded-lg bg-zinc-950 p-4 font-mono text-xs text-green-400 overflow-auto">
                  <div className="flex items-start gap-2">
                    <span className="text-zinc-500 select-none">$</span>
                    <code className="break-all whitespace-pre-wrap">
                      {getCurrentCommand()}
                    </code>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 ">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="h-8 text-xs bg-transparent"
                  onClick={copyCommand}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-green-500" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      复制命令
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetConfig}
                  className="h-8 bg-transparent"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  重置配置
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  执行测试
                </Button>
              </div>
            </div>

            {/* 帮助信息 */}
            <div className="p-4 border-t border-border/40">
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">使用说明</span>
                </div>
                <ul className="text-[10px] text-muted-foreground space-y-1">
                  <li>1. 通过 hdc shell 进入设备</li>
                  <li>2. 复制生成的命令执行测试</li>
                  <li>3. 测试结果存放于 /data/local/tmp/wukong/report/</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
