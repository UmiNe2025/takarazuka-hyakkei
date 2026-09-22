// Monday-based JST calendar weeks; multiple manual attempts in one week count once.
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export function updateDatasetStatus(previous = {}, date, error = null) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  const week = day.toISOString().slice(0, 10);
  const previousWeek = previous.lastFailureWeek;
  const adjacent = previousWeek && Date.parse(week) - Date.parse(previousWeek) === WEEK_MS;
  const weeks = previousWeek === week ? previous.consecutiveFailedWeeks :
    adjacent ? previous.consecutiveFailedWeeks + 1 : 1;
  return {
    lastAttempt: date,
    lastSuccess: error ? (previous.lastSuccess || null) : date,
    consecutiveFailures: error ? (previous.consecutiveFailures || 0) + 1 : 0,
    consecutiveFailedWeeks: error ? weeks : 0,
    lastFailureWeek: error ? week : null,
    lastError: error ? String(error.message || error).slice(0, 500) : null,
  };
}
