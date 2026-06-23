import type { DeductionItem } from "../lib/salary";
import { formatKRW } from "../lib/salary";

const COLORS: Record<string, string> = {
  np: "bg-amber-400",
  health: "bg-sky-400",
  ltc: "bg-teal-400",
  emp: "bg-violet-400",
  tax: "bg-rose-400",
  local: "bg-orange-400",
};

interface Props {
  deductions: DeductionItem[];
  monthlyGross: number;
}

export default function DeductionBars({ deductions, monthlyGross }: Props) {
  const max = Math.max(...deductions.map((d) => d.monthly), 1);
  return (
    <div className="space-y-3">
      {deductions.map((d) => {
        const pctOfGross = monthlyGross > 0 ? (d.monthly / monthlyGross) * 100 : 0;
        const barPct = (d.monthly / max) * 100;
        return (
          <div key={d.key}>
            <div className="flex items-baseline justify-between text-sm mb-1">
              <span className="flex items-center gap-2 text-slate-200">
                <span className={`inline-block h-2.5 w-2.5 rounded-sm ${COLORS[d.key]}`} />
                {d.label}
              </span>
              <span className="tabular-nums text-slate-100 font-medium">
                {formatKRW(d.monthly)}원
                <span className="ml-1.5 text-xs text-slate-400">
                  {pctOfGross.toFixed(1)}%
                </span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-700/50 overflow-hidden">
              <div
                className={`h-full rounded-full ${COLORS[d.key]} transition-all duration-500 ease-out`}
                style={{ width: `${barPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
