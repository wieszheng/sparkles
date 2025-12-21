import * as React from "react";
import { Check, ChevronsUpDown, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tag } from "@/components/tag"; // Import the new Tag component

interface Item {
  value: string;
  label: string;
  color?: string; // Optional color for the tag
  icon?: React.ElementType; // Optional icon for the tag
}

interface CustomAction {
  label: string;
  onSelect: () => void;
  icon?: React.ElementType;
}

interface MultiSelectComboboxProps {
  items: Item[];
  selected: string[];
  onSelectedChange: (selected: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  maxDisplayItems?: number; // New prop for controlling displayed items
  customActions?: CustomAction[]; // New prop for custom actions
}

export function MultiSelectCombobox({
  items,
  selected,
  onSelectedChange,
  placeholder = "查看...",
  emptyMessage = "没有数据.",
  maxDisplayItems = 3, // Default to 3 items
  customActions,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleSelect = (itemValue: string) => {
    const newSelected = selected.includes(itemValue)
      ? selected.filter((s) => s !== itemValue)
      : [...selected, itemValue];
    onSelectedChange(newSelected);
    setInputValue(""); // Clear input after selection
  };

  const handleRemove = (itemValue: string) => {
    const newSelected = selected.filter((s) => s !== itemValue);
    onSelectedChange(newSelected);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent popover from closing
    onSelectedChange([]);
    setInputValue("");
  };

  // Get the full item objects for selected values
  const selectedItems = selected
    .map((value) => items.find((item) => item.value === value))
    .filter(Boolean) as Item[];

  const displayItems = selectedItems.slice(0, maxDisplayItems);
  const overflowCount = selectedItems.length - maxDisplayItems;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-8.5 flex items-center px-3 py-2 bg-transparent"
        >
          <div className="flex flex-wrap gap-1 flex-grow">
            {selectedItems.length > 0 ? (
              <>
                {displayItems.map((item) => (
                  <Tag
                    key={item.value}
                    label={item.label}
                    onRemove={() => handleRemove(item.value)}
                    color={item.color}
                    icon={item.icon}
                  />
                ))}
                {overflowCount > 0 && (
                  <Tag
                    label={`+${overflowCount} more`}
                    onRemove={() => {
                      /* No remove action for overflow tag */
                    }}
                    // You can customize the overflow tag's appearance here if needed
                  />
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClearAll}
                aria-label="Clear all selections"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder="查找..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => {
                return (
                  <CommandItem
                    key={item.value}
                    value={item.label}
                    onSelect={() => handleSelect(item.value)}
                  >
                    <Check
                      className={cn(
                        "mr-1 h-4 w-4",
                        selected.includes(item.value)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {item.label} {/* Removed item icon here */}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {customActions && customActions.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  {customActions.map((action, index) => {
                    const ActionIcon = action.icon;
                    return (
                      <CommandItem
                        key={`custom-action-${index}`}
                        value={action.label} // Make custom actions searchable
                        onSelect={() => {
                          action.onSelect();
                          setOpen(false); // Close popover after action
                        }}
                      >
                        {ActionIcon && <ActionIcon className="mr-1 h-4 w-4" />}
                        {action.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
