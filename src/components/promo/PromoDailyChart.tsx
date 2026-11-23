"use client";

type DayPoint = {
  istDate: string;
  impressions: number;
  clicks: number;
};

export default function PromoDailyChart({
  days,
}: {
  days: DayPoint[];
}) {
  if (!days.length) {
    return (
      <p className="py-10 text-center text-sm text-[var(--muted)]">
        No daily data in this range.
      </p>
    );
  }

  const max = Math.max(
    1,
    ...days.map((d) => Math.max(d.impressions, d.clicks)),
  );
  const width = 640;
  const height = 200;
  const pad = 28;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const x = (i: number) =>
    pad + (days.length === 1 ? innerW / 2 : (i / (days.length - 1)) * innerW);
  const y = (v: number) => pad + innerH - (v / max) * innerH;

  const impressPath = days
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.impressions)}`)
    .join(" ");
  const clickPath = days
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.clicks)}`)
    .join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full min-w-[320px]"
        role="img"
        aria-label="Daily impressions and clicks"
      >
        <line
          x1={pad}
          y1={pad + innerH}
          x2={pad + innerW}
          y2={pad + innerH}
          stroke="var(--border)"
        />
        <path
          d={impressPath}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2"
        />
        <path
          d={clickPath}
          fill="none"
          stroke="var(--info)"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        {days.map((d, i) => (
          <text
            key={d.istDate}
            x={x(i)}
            y={height - 6}
            textAnchor="middle"
            className="fill-[var(--muted)]"
            style={{ fontSize: 9 }}
          >
            {d.istDate.slice(5)}
          </text>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-[var(--brand)]" />
          Impressions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 border-t border-dashed border-[var(--info)]" />
          Clicks
        </span>
      </div>
    </div>
  );
}
