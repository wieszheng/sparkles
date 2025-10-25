import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  enableTypewriter?: boolean;
  typewriterSpeed?: number;
}

function CodeBlock({ children, className, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  const handleCopy = async () => {
    if (typeof children === "string") {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  if (match) {
    return (
      <div className="relative group">
        <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-t-lg border-b">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {language}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 w-6 p-0"
          >
            {copied ? (
              <Check className="h-3 w-3 " />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
        <pre className="bg-muted/50 p-4 rounded-b-lg overflow-x-auto ">
          <code className={`${className} text-sm`} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <code
      className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  );
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  useEffect(() => {
    // 添加自定义的代码高亮样式
    const styleId = "custom-highlight-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        /* 浅色模式代码高亮 */
        .hljs {
          background: hsl(var(--muted)) !important;
          color: hsl(var(--foreground)) !important;
          padding: 0.5em;
          border-radius: 0.375rem;
        }
        
        /* 深色模式代码高亮 */
        .dark .hljs {
          background: hsl(var(--muted)) !important;
          color: hsl(var(--foreground)) !important;
        }
        
        /* 关键字 */
        .hljs-keyword,
        .hljs-selector-tag,
        .hljs-literal,
        .hljs-section,
        .hljs-link {
          color: #d73a49;
        }
        
        .dark .hljs-keyword,
        .dark .hljs-selector-tag,
        .dark .hljs-literal,
        .dark .hljs-section,
        .dark .hljs-link {
          color: #ff7b72;
        }
        
        /* 字符串 */
        .hljs-string {
          color: #032f62;
        }
        
        .dark .hljs-string {
          color: #a5d6ff;
        }
        
        /* 注释 */
        .hljs-comment,
        .hljs-quote {
          color: #6a737d;
          font-style: italic;
        }
        
        .dark .hljs-comment,
        .dark .hljs-quote {
          color: #8b949e;
        }
        
        /* 数字 */
        .hljs-number {
          color: #005cc5;
        }
        
        .dark .hljs-number {
          color: #79c0ff;
        }
        
        /* 函数名 */
        .hljs-title,
        .hljs-function .hljs-title {
          color: #6f42c1;
        }
        
        .dark .hljs-title,
        .dark .hljs-function .hljs-title {
          color: #d2a8ff;
        }
        
        /* 变量 */
        .hljs-variable,
        .hljs-name {
          color: #e36209;
        }
        
        .dark .hljs-variable,
        .dark .hljs-name {
          color: #ffa657;
        }
        
        /* 属性 */
        .hljs-attr,
        .hljs-attribute {
          color: #005cc5;
        }
        
        .dark .hljs-attr,
        .dark .hljs-attribute {
          color: #79c0ff;
        }
        
        /* 类型 */
        .hljs-type,
        .hljs-class .hljs-title {
          color: #6f42c1;
        }
        
        .dark .hljs-type,
        .dark .hljs-class .hljs-title {
          color: #d2a8ff;
        }
        
        /* 标签 */
        .hljs-tag {
          color: #22863a;
        }
        
        .dark .hljs-tag {
          color: #7ee787;
        }
        
        /* 符号 */
        .hljs-symbol,
        .hljs-bullet,
        .hljs-subst {
          color: #005cc5;
        }
        
        .dark .hljs-symbol,
        .dark .hljs-bullet,
        .dark .hljs-subst {
          color: #79c0ff;
        }
        
        /* 元信息 */
        .hljs-meta {
          color: #6a737d;
        }
        
        .dark .hljs-meta {
          color: #8b949e;
        }
        
        /* 强调 */
        .hljs-emphasis {
          font-style: italic;
        }
        
        .hljs-strong {
          font-weight: bold;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div
      className={cn("prose prose-sm max-w-none dark:prose-invert", className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          code: CodeBlock,
          pre: ({ children }) => <div>{children}</div>,
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-4 text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mb-3 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium mb-2 text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-3 text-foreground leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 space-y-1 text-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1 text-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-foreground">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-3">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border border-border rounded-lg">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 bg-muted font-medium text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2">{children}</td>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
