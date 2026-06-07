export default function StatusLegend() {
  return (
    <div className="flex items-center gap-4 text-xs px-4 py-2.5 rounded-lg bg-card/40 border border-border/50">
      <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Estado:</span>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
        <span className="text-foreground">Normal</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.5)]" />
        <span className="text-foreground">Advertencia</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-destructive shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
        <span className="text-foreground">Crítico</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
        <span className="text-muted-foreground">Capa inactiva</span>
      </div>
    </div>
  );
}