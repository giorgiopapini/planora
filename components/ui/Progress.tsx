export function Progress({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return <div className="flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={label}><div className="h-full rounded-full bg-accent transition-[width] duration-120" style={{ width: `${clamped}%` }} /></div><span className="w-10 text-right text-xs font-medium text-secondary">{clamped}%</span></div>;
}
