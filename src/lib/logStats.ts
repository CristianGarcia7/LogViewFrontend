import type { LogEntryDto, LogType } from '../api/types';

/**
 * Pure aggregation helpers over the log lines currently loaded in the client.
 *
 * These compute metrics from the fetched window (last N lines), NOT the full
 * history. When the backend ships a server-side aggregation endpoint (see
 * docs/stats-endpoint-spec.md), the LogStatsPanel can swap its data source
 * without changing these shapes.
 */

export type Tone = 'ok' | 'info' | 'warn' | 'error' | 'neutral';

export interface Segment {
  key: string;
  label: string;
  count: number;
  tone: Tone;
}

export interface Distribution {
  segments: Segment[];
  total: number;
}

export interface RankedItem {
  label: string;
  count: number;
}

export interface TimeBucket {
  label: string;
  count: number;
}

export interface LogSummary {
  /** Total lines considered (lines that carried the relevant field). */
  total: number;
  /** Errors: 5xx for access logs, `error`-level for error logs. */
  errorCount: number;
  /** errorCount / total, in 0..1. */
  errorRate: number;
  /** Warnings: 4xx for access logs, `warn`-level for error logs. */
  warnCount: number;
  /** Distinct request paths (access logs only; 0 otherwise). */
  uniquePaths: number;
}

// ---------------------------------------------------------------
// Status code distribution (access logs)
// ---------------------------------------------------------------
export function statusDistribution(lines: LogEntryDto[]): Distribution {
  const counts = { c2: 0, c3: 0, c4: 0, c5: 0, other: 0 };
  let total = 0;

  for (const line of lines) {
    if (line.status === undefined) continue;
    total += 1;
    const code = line.status;
    if (code >= 500) counts.c5 += 1;
    else if (code >= 400) counts.c4 += 1;
    else if (code >= 300) counts.c3 += 1;
    else if (code >= 200) counts.c2 += 1;
    else counts.other += 1;
  }

  const all: Segment[] = [
    { key: '2xx', label: '2xx Success', count: counts.c2, tone: 'ok' },
    { key: '3xx', label: '3xx Redirect', count: counts.c3, tone: 'info' },
    { key: '4xx', label: '4xx Client', count: counts.c4, tone: 'warn' },
    { key: '5xx', label: '5xx Server', count: counts.c5, tone: 'error' },
    { key: 'other', label: 'Other', count: counts.other, tone: 'neutral' },
  ];

  return { segments: all.filter((s) => s.count > 0), total };
}

// ---------------------------------------------------------------
// Level distribution (error logs)
// ---------------------------------------------------------------
export function levelDistribution(lines: LogEntryDto[]): Distribution {
  const order: { key: string; tone: Tone }[] = [
    { key: 'error', tone: 'error' },
    { key: 'warn', tone: 'warn' },
    { key: 'notice', tone: 'info' },
    { key: 'info', tone: 'ok' },
  ];
  const counts = new Map<string, number>();
  let total = 0;

  for (const line of lines) {
    const level = line.level?.toLowerCase();
    if (!level) continue;
    total += 1;
    counts.set(level, (counts.get(level) ?? 0) + 1);
  }

  const segments: Segment[] = order
    .map(({ key, tone }) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      count: counts.get(key) ?? 0,
      tone,
    }))
    .filter((s) => s.count > 0);

  return { segments, total };
}

// ---------------------------------------------------------------
// Top request paths (access logs)
// ---------------------------------------------------------------
export function topPaths(lines: LogEntryDto[], limit = 6): RankedItem[] {
  const counts = new Map<string, number>();
  for (const line of lines) {
    if (!line.path) continue;
    counts.set(line.path, (counts.get(line.path) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ---------------------------------------------------------------
// Requests bucketed over time
// ---------------------------------------------------------------
export function timeBuckets(lines: LogEntryDto[], bucketCount = 24): TimeBucket[] {
  const stamps = lines
    .map((l) => (l.timestamp ? new Date(l.timestamp).getTime() : NaN))
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);

  if (stamps.length === 0) return [];

  const min = stamps[0];
  const max = stamps[stamps.length - 1];
  const span = max - min;

  // All within the same instant — single bucket
  if (span === 0) {
    return [{ label: new Date(min).toLocaleTimeString(), count: stamps.length }];
  }

  const buckets: TimeBucket[] = [];
  const size = span / bucketCount;
  const tallies = new Array<number>(bucketCount).fill(0);

  for (const t of stamps) {
    const idx = Math.min(bucketCount - 1, Math.floor((t - min) / size));
    tallies[idx] += 1;
  }

  for (let i = 0; i < bucketCount; i += 1) {
    const bucketStart = new Date(min + i * size);
    buckets.push({
      label: bucketStart.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      count: tallies[i],
    });
  }

  return buckets;
}

// ---------------------------------------------------------------
// Headline summary
// ---------------------------------------------------------------
export function summarize(lines: LogEntryDto[], logType: LogType): LogSummary {
  if (logType === 'access') {
    const { segments, total } = statusDistribution(lines);
    const find = (key: string) => segments.find((s) => s.key === key)?.count ?? 0;
    const errorCount = find('5xx');
    const warnCount = find('4xx');
    const uniquePaths = new Set(
      lines.filter((l) => l.path).map((l) => l.path),
    ).size;
    return {
      total,
      errorCount,
      errorRate: total > 0 ? errorCount / total : 0,
      warnCount,
      uniquePaths,
    };
  }

  const { segments, total } = levelDistribution(lines);
  const find = (key: string) => segments.find((s) => s.key === key)?.count ?? 0;
  const errorCount = find('error');
  const warnCount = find('warn');
  return {
    total,
    errorCount,
    errorRate: total > 0 ? errorCount / total : 0,
    warnCount,
    uniquePaths: 0,
  };
}
