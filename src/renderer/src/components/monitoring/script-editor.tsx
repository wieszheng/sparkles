import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileCode, Code2, Save } from "lucide-react";
import type { ScriptFile } from "./types";

interface ScriptEditorProps {
  scripts: ScriptFile[];
  onSaveScript: (id: number, content: string) => void;
}

export function ScriptEditor({ scripts, onSaveScript }: ScriptEditorProps) {
  const [editingScript, setEditingScript] = useState<ScriptFile | null>(null);
  const [scriptContent, setScriptContent] = useState("");

  const handleEditScript = (script: ScriptFile) => {
    setEditingScript(script);
    setScriptContent(script.content);
  };

  const handleSaveScript = () => {
    if (editingScript) {
      onSaveScript(editingScript.id, scriptContent);
      setEditingScript(null);
      setScriptContent("");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-140px)]">
      {/* 脚本列表 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-foreground">脚本文件</h2>
          <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 px-2">
            <Plus className="h-3 w-3" />
            新建
          </Button>
        </div>
        <div className="space-y-1.5">
          {scripts.map((script) => (
            <button
              key={script.id}
              onClick={() => handleEditScript(script)}
              className={`w-full text-left rounded-md border p-2.5 transition-colors ${
                editingScript?.id === script.id
                  ? "border-primary bg-primary/5"
                  : "border-border/30 hover:border-border/50 bg-muted/10"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium text-xs">{script.label}</span>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                <span>{script.name}</span>
                <span>{script.lastModified}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 代码编辑器 */}
      <div className="lg:col-span-3 rounded-md border border-border/30 bg-muted/10 overflow-hidden flex flex-col">
        {editingScript ? (
          <>
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/20">
              <div className="flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">
                  {editingScript.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => {
                    setEditingScript(null);
                    setScriptContent("");
                  }}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveScript}
                  className="h-6 text-xs gap-1 px-2"
                >
                  <Save className="h-3 w-3" />
                  保存
                </Button>
              </div>
            </div>
            <Textarea
              value={scriptContent}
              onChange={(e) => setScriptContent(e.target.value)}
              className="flex-1 min-h-0 rounded-none border-0 font-mono text-xs resize-none focus-visible:ring-0"
              placeholder="// 编写你的自动化脚本..."
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center p-4">
            <FileCode className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <h3 className="text-xs font-medium mb-0.5">选择一个脚本</h3>
            <p className="text-[10px] text-muted-foreground">
              从左侧列表中选择脚本进行编辑
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
