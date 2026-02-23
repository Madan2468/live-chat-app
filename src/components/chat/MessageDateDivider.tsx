"use client";

import { format, isToday, isYesterday } from "date-fns";

interface MessageDateDividerProps {
  timestamp: number;
}

function formatDividerDate(timestamp: number): string {
  const date = new Date(timestamp);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

export default function MessageDateDivider({ timestamp }: MessageDateDividerProps) {
  return (
    <div className="flex items-center gap-3 my-6 px-2 select-none">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-1.5 rounded-full bg-accent/60 backdrop-blur-sm border border-border shadow-sm whitespace-nowrap">
        {formatDividerDate(timestamp)}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-border via-transparent to-transparent" />
    </div>
  );
}
