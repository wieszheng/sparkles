import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats seconds into MM:SS.mmm
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
};

/**
 * Calculates duration in milliseconds
 */
export const calculateDurationMs = (start: number, end: number): number => {
  return Math.max(0, Math.round((end - start) * 1000));
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};
