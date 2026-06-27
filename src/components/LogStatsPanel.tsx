import { useMemo, useState } from 'react';
import type { LogEntryDto, LogType } from '../api/types';
import {
  levelDistribution,
  statusDistribution,
  summarize,
  timeBuckets,
  topPaths,
  type Distribution,
  type Tone,
} from '../lib/logStats';
import { Icon, type IconName } from './Icon';
import './LogStatsPanel.css';

// Tone → brand token. Inline style is used because SVG `stroke` cannot read a
// CSS custom property through a presentation attribute, only through style.
const TONE_VAR: Record<Tone, string> = {
  ok: 'var(--semantic-ok-text)',
  info: 'var(--op-blue-500)',
  warn: 'var(--semantic-warn-text)',
  error: 'var(--semantic-error-text)',
  neutral: 'var(--level-5-text)',
};

function pct(value: number, total: number): number {
  return total > 0 ? (value / total) * 100 : 0;
}

// ---------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------
function StatCard({
  icon,
  value,
  label,
  tone = 'info',
}: {
  icon: IconName;
  value: string;
  label: string;
  tone?: Tone;
}) {
  return (
    <div className="stat-card">
      <span className={`stat-card__icon stat-card__icon--${tone}`}>
        <Icon name={icon} size={18} />
      </span>
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------
// Donut chart (status / level distribution)
// ---------------------------------------------------------------
function Donut({ dist, title }: { dist: Distribution; title: string }) {
  const { segments, total } = dist;
  let cumulative = 0;

  return (
    <div className="donut" role="img" aria-label={`${title}: ${total} entries`}>
      <div className="donut__chart">
        <svg viewBox="0 0 42 42" className="donut__svg">
          <circle
            className="donut__track"
            cx="21"
            cy="21"
            r="15.915"
            fill="none"
          />
          {segments.map((seg) => {
            const segPct = pct(seg.count, total);
            const dasharray = `${segPct} ${100 - segPct}`;
            const dashoffset = 100 - cumulative + 25; // start at 12 o'clock
            cumulative += segPct;
            return (
              <circle
                key={seg.key}
                className="donut__segment"
                cx="21"
                cy="21"
                r="15.915"
                fill="none"
                strokeDasharray={dasharray}
                strokeDashoffset={dashoffset}
                style={{ stroke: TONE_VAR[seg.tone] }}
              />
            );
          })}
        </svg>
        <div className="donut__center">
          <span className="donut__total">{total}</span>
          <span className="donut__total-label">entries</span>
        </div>
      </div>
      <ul className="donut__legend">
        {segments.map((seg) => (
          <li key={seg.key} className="donut__legend-item">
            <span
              className="donut__swatch"
              style={{ backgroundColor: TONE_VAR[seg.tone] }}
            />
            <span className="donut__legend-label">{seg.label}</span>
            <span className="donut__legend-count">{seg.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------
// Mini bars (requests over time)
// ---------------------------------------------------------------
function MiniBars({ buckets }: { buckets: { label: string; count: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));

  if (buckets.length === 0) {
    return (
      <p className="chart-empty">No timestamps in the loaded lines.</p>
    );
  }

  return (
    <div className="minibars" role="img" aria-label="Requests over time">
      {buckets.map((bucket, i) => (
        <div
          key={i}
          className="minibars__col"
          title={`${bucket.label} · ${bucket.count}`}
        >
          <div
            className="minibars__bar"
            style={{ height: `${pct(bucket.count, max)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------
// Ranked bar list (top paths)
// ---------------------------------------------------------------
function BarList({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));

  if (items.length === 0) {
    return <p className="chart-empty">No path data in the loaded lines.</p>;
  }

  return (
    <ul className="barlist">
      {items.map((item) => (
        <li key={item.label} className="barlist__row">
          <span className="barlist__label" title={item.label}>
            {item.label}
          </span>
          <span className="barlist__track">
            <span
              className="barlist__fill"
              style={{ width: `${pct(item.count, max)}%` }}
            />
          </span>
          <span className="barlist__count">{item.count}</span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------
// Panel
// ---------------------------------------------------------------
export function LogStatsPanel({
  lines,
  logType,
}: {
  lines: LogEntryDto[];
  logType: LogType;
}) {
  const [open, setOpen] = useState(true);

  const { summary, dist, buckets, paths } = useMemo(() => {
    return {
      summary: summarize(lines, logType),
      dist: logType === 'access' ? statusDistribution(lines) : levelDistribution(lines),
      buckets: timeBuckets(lines),
      paths: topPaths(lines),
    };
  }, [lines, logType]);

  if (lines.length === 0) return null;

  const errorPct = `${Math.round(summary.errorRate * 100)}%`;
  const distTitle = logType === 'access' ? 'Status codes' : 'Levels';

  return (
    <section className="logview-stats" aria-label="Log overview">
      <div className="logview-stats__head">
        <h2 className="logview-stats__title">
          <Icon name="barChart" size={18} />
          Overview
        </h2>
        <span className="logview-stats__caption">
          Based on {lines.length} loaded {lines.length === 1 ? 'line' : 'lines'}
        </span>
        <button
          type="button"
          className="op-button-ghost logview-stats__toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? 'Hide' : 'Show'}
        </button>
      </div>

      {open && (
        <div className="logview-stats__body">
          {/* Stat cards */}
          <div className="stat-cards">
            <StatCard icon="hash" value={String(summary.total)} label="Total entries" tone="info" />
            <StatCard
              icon="alertCircle"
              value={`${summary.errorCount} · ${errorPct}`}
              label={logType === 'access' ? '5xx errors' : 'Errors'}
              tone="error"
            />
            <StatCard
              icon="alertTriangle"
              value={String(summary.warnCount)}
              label={logType === 'access' ? '4xx warnings' : 'Warnings'}
              tone="warn"
            />
            {logType === 'access' ? (
              <StatCard icon="route" value={String(summary.uniquePaths)} label="Unique paths" tone="ok" />
            ) : (
              <StatCard icon="activity" value={String(buckets.length)} label="Time buckets" tone="ok" />
            )}
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-card__title">{distTitle}</h3>
              <Donut dist={dist} title={distTitle} />
            </div>

            <div className="chart-card">
              <h3 className="chart-card__title">
                <Icon name="trendingUp" size={14} /> Requests over time
              </h3>
              <MiniBars buckets={buckets} />
            </div>

            {logType === 'access' && (
              <div className="chart-card">
                <h3 className="chart-card__title">
                  <Icon name="route" size={14} /> Top paths
                </h3>
                <BarList items={paths} />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
