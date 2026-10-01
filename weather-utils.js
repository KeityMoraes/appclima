export function alertLevel(humidity) {
  if (humidity < 20) return 'emergency';
  if (humidity < 30) return 'attention';
  return 'normal';
}
export function localDay(timestamp, offset) {
  return new Date((timestamp + offset) * 1000).toISOString().slice(0, 10);
}
export function dayRange(list, timestamp, offset) {
  const today = list.filter(item => localDay(item.dt, offset) === localDay(timestamp, offset));
  return today.length ? { min: Math.min(...today.map(item => item.main.temp_min)), max: Math.max(...today.map(item => item.main.temp_max)), samples: today.length } : null;
}
