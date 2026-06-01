/**
 * Parses human-readable time strings (e.g. "7d", "10m", "1h", "30s") into milliseconds.
 * Supported units: s (seconds), m (minutes), h (hours), d (days).
 */
export const parseTime = (timeStr?: any): number => {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d+)([smhd])$/);
  if (!match) return 0;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
};

/**
 * Parses human-readable time strings (e.g. "10m", "1h") into minutes.
 */
export const parseTimeToMinutes = (
  timeStr?: string,
  defaultMinutes = 10
): number => {
  if (!timeStr) return defaultMinutes;
  const ms = parseTime(timeStr);
  if (ms === 0) return defaultMinutes;
  return Math.round(ms / (60 * 1000));
};
