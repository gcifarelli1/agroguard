import type { TooltipProps } from 'recharts';

/**
 * Tooltip industrial compartido para todos los gráficos de Recharts.
 * Fondo oscuro translúcido, tipografía blanca de alto contraste y borde refinado.
 */
export default function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/15 bg-black/80 backdrop-blur-md px-3 py-2 shadow-2xl ring-1 ring-white/5">
      {label != null && label !== '' && (
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          // El color por serie viene en `entry.color`; en barras/pie con <Cell>
          // el color real está en el dato (`entry.payload.color`).
          const swatch = entry.color || (entry.payload as { color?: string })?.color || '#ffffff';
          return (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: swatch }}
                />
                <span className="text-white/70">{entry.name}</span>
              </div>
              <span className="font-mono font-semibold text-white tabular-nums">
                {entry.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
