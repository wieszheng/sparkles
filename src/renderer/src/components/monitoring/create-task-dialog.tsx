import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { mockApps } from "./mock-data";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scripts: ScriptFile[];
  formData: { name: string; script: string; app: string };
  onFormDataChange: (data: {
    name: string;
    script: string;
    app: string;
  }) => void;
  onCreateTask: () => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  scripts,
  formData,
  onFormDataChange,
  onCreateTask,
}: CreateTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">新建监控任务</DialogTitle>
          <DialogDescription className="text-xs">
            创建一个新的场景监控任务
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">任务名称</label>
            <Input
              placeholder="例如: 登录流程监控"
              value={formData.name}
              onChange={(e) =>
                onFormDataChange({ ...formData, name: e.target.value })
              }
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">选择脚本</label>
            <Select
              value={formData.script}
              onValueChange={(value) =>
                onFormDataChange({ ...formData, script: value })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="选择一个脚本" />
              </SelectTrigger>
              <SelectContent>
                {scripts.map((script) => (
                  <SelectItem key={script.id} value={script.name}>
                    {script.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">选择应用</label>
            <Select
              value={formData.app}
              onValueChange={(value) =>
                onFormDataChange({ ...formData, app: value })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="选择一个应用" />
              </SelectTrigger>
              <SelectContent>
                {mockApps.map((app) => (
                  <SelectItem key={app.id} value={app.name}>
                    {app.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            size="sm"
            className="h-8 text-xs bg-transparent"
          >
            取消
          </Button>
          <Button onClick={onCreateTask} size="sm" className="h-8 text-xs">
            创建任务
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
