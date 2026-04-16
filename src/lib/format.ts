export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const formatTime = (t: string) => t?.slice(0, 5) ?? "";

export const todayDow = () => {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 ? 7 : d;
};

export function relativeDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Math.round((date.getTime() - Date.now()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  if (diff < -1 && diff > -7) return `${-diff} days ago`;
  return date.toLocaleDateString();
}

export function priorityClass(p: string) {
  switch (p) {
    case "high":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "medium":
      return "bg-warning/15 text-warning-foreground border-warning/30";
    case "low":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-info/10 text-info border-info/20";
  }
}

export function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
