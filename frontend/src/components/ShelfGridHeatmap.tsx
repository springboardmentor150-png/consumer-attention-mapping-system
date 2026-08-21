"use client";

import { useState } from "react";
import { GridHeatmapData, GridHeatmapCell } from "@/lib/api";
import { Flame, Eye, Clock, Sparkles, Layers, Info } from "lucide-react";

interface ShelfGridHeatmapProps {
  data: GridHeatmapData | null;
  loading?: boolean;
  onCellClick?: (cell: GridHeatmapCell) => void;
}

export function ShelfGridHeatmap({ data, loading, onCellClick }: ShelfGridHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<GridHeatmapCell | null>(null);

  if (loading || !data) {
    return (
      <div className="rounded-3xl glass-panel-glow border border-white/10 p-6 flex flex-col items-center justify-center min-h-[360px] text-center">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400 font-mono">
          Loading 5×8 Shelf Attention Matrix from PostgreSQL...
        </p>
      </div>
    );
  }

  const rows = data.rows || 5;
  const cols = data.cols || 8;

  return (
    <div className="rounded-3xl glass-panel-glow border border-white/10 p-5 sm:p-6 space-y-5">
      {/* Top Header & Hotspot summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              5×8 Spatial Attention Matrix
            </span>
            <span className="text-xs text-slate-400 font-mono">
              • {data.total_cells} Cells
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white tracking-tight">
            Shelf Level Attention &amp; Dwell Heatmap
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated shopper dwell seconds mapped to vertical shelf tiers and horizontal aisle bins.
          </p>
        </div>

        {data.peak_cell && (
          <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 self-start sm:self-auto">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <Flame className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-[9px] font-mono text-red-300 uppercase block">
                Peak Hotspot Cell
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {data.peak_cell.cell_id} ({data.peak_cell.dwell_seconds}s)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5x8 Interactive Grid */}
      <div className="space-y-2">
        {/* Column Labels */}
        <div className="grid grid-cols-8 gap-1.5 px-8 text-center text-[10px] font-mono text-slate-500">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div key={cIdx} className="truncate">
              Sec {cIdx + 1}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1.5">
          {data.grid.map((rowCells, rIdx) => (
            <div key={rIdx} className="flex items-center gap-2">
              {/* Row Level Label */}
              <span className="w-6 text-[10px] font-mono text-slate-400 text-right shrink-0">
                L{rows - rIdx}
              </span>

              {/* 8 Columns */}
              <div className="grid grid-cols-8 gap-1.5 flex-1">
                {rowCells.map((cell) => {
                  const isHovered = hoveredCell?.cell_id === cell.cell_id;
                  const isPeak = cell.is_hotspot;

                  return (
                    <button
                      key={cell.cell_id}
                      onClick={() => onCellClick?.(cell)}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{
                        backgroundColor: cell.color_hex,
                        color: cell.normalized_intensity > 0.45 ? "#ffffff" : "#1e293b",
                      }}
                      className={`relative aspect-[16/11] rounded-xl flex flex-col items-center justify-center p-1 font-mono transition-all duration-200 cursor-pointer shadow-sm ${
                        isPeak
                          ? "ring-2 ring-red-400 ring-offset-2 ring-offset-black scale-[1.02] font-bold"
                          : ""
                      } ${
                        isHovered
                          ? "scale-105 shadow-lg shadow-black/50 z-10"
                          : "hover:scale-[1.03]"
                      }`}
                    >
                      <span className="text-[9px] font-extrabold block leading-tight">
                        {cell.cell_id}
                      </span>
                      <span className="text-[10px] font-black block leading-tight">
                        {cell.dwell_seconds > 0 ? `${cell.dwell_seconds}s` : "0s"}
                      </span>

                      {isPeak && (
                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
                          <Flame className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cell Detail Tooltip / Active Inspect Bar */}
      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              {hoveredCell ? `Inspecting ${hoveredCell.cell_id}` : "Hover Over Grid Cells"}
            </span>
            <span className="font-semibold text-white">
              {hoveredCell
                ? `${hoveredCell.shelf_level} • ${hoveredCell.aisle_section}`
                : "Point at any of the 40 cells to view exact dwell seconds & visitor counts"}
            </span>
          </div>
        </div>

        {hoveredCell ? (
          <div className="flex items-center gap-4 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block">Dwell Time</span>
              <span className="text-sm font-bold text-emerald-400">
                {hoveredCell.dwell_seconds}s
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Intensity</span>
              <span className="text-sm font-bold text-amber-400">
                {Math.round(hoveredCell.normalized_intensity * 100)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Unique Shoppers</span>
              <span className="text-sm font-bold text-cyan-300">
                {hoveredCell.visitor_count}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 font-mono text-[11px] text-slate-400">
            <span>Total Dwell: <b className="text-emerald-400">{data.total_dwell_seconds}s</b></span>
            <span>Max Cell: <b className="text-amber-400">{data.max_cell_dwell_seconds}s</b></span>
          </div>
        )}
      </div>

      {/* YlOrRd Heatmap Color Legend */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <span>YlOrRd Spectrum:</span>
          <span className="text-slate-500">(Yellow = Low Dwell → Orange = Moderate → Red = Peak Dwell)</span>
        </span>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">0%</span>
          <div className="w-36 h-2.5 rounded-full bg-gradient-to-r from-[#ffffb2] via-[#fed976] via-[#fd8d3c] to-[#bd0026] border border-white/10" />
          <span className="text-slate-300 font-bold">100%</span>
        </div>
      </div>
    </div>
  );
}
