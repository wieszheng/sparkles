import type * as React from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface TagProps {
  label: string;
  onRemove: () => void;
  color?: string; // Hex color string, e.g., "#FF0000"
  icon?: React.ElementType; // Lucide React icon component
}

export function Tag({ label, onRemove, color, icon: Icon }: TagProps) {
  return (
    <Badge variant="secondary" className="flex items-center gap-1 pr-1">
      {Icon ? (
        <Icon className="h-3 w-3" />
      ) : color ? (
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      ) : null}
      <span>{label}</span>
      <button
        type="button"
        className="ml-1 rounded-full"
        onMouseDown={(e) => e.stopPropagation()} // Prevent popover from closing
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </button>
    </Badge>
  );
}
