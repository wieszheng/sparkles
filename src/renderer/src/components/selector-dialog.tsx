import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SelectorDialogProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

// 模拟已保存的xpath信息
const savedSelectors = [
  { id: 1, name: "登录按钮", xpath: "//button[@id='login-btn']", type: "按钮" },
  {
    id: 2,
    name: "用户名输入框",
    xpath: "//input[@name='username']",
    type: "输入框",
  },
  {
    id: 3,
    name: "密码输入框",
    xpath: "//input[@type='password']",
    type: "输入框",
  },
  {
    id: 4,
    name: "提交表单",
    xpath: "//form[@class='login-form']",
    type: "表单",
  },
  { id: 5, name: "导航菜单", xpath: "//nav[@class='main-nav']", type: "导航" },
];

export function SelectorDialog({
  value,
  onChange,
  children,
}: SelectorDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customSelector, setCustomSelector] = useState(value);

  const filteredSelectors = savedSelectors.filter(
    (selector) =>
      selector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      selector.xpath.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelect = (xpath: string) => {
    onChange(xpath);
    setCustomSelector(xpath);
    setOpen(false);
  };

  const handleCustomSave = () => {
    onChange(customSelector);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>选择器配置</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索已保存的选择器..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 已保存的选择器列表 */}
          <div className="flex-1 overflow-y-auto space-y-2">
            <Label className="text-sm font-medium">已保存的选择器</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredSelectors.map((selector) => (
                <Card
                  key={selector.id}
                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSelect(selector.xpath)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{selector.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {selector.xpath}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {selector.type}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 自定义选择器 */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="custom-selector" className="text-sm font-medium">
              自定义选择器
            </Label>
            <Input
              id="custom-selector"
              value={customSelector}
              onChange={(e) => setCustomSelector(e.target.value)}
              placeholder="输入CSS选择器或XPath..."
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleCustomSave} size="sm">
                使用此选择器
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
