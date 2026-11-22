// Trainer availability is written in the gym's local time ("Monday 07:00-11:00"),
// but the server may run in another time zone once deployed. These helpers always
// read a date as Beirut time (or GYM_TIMEZONE if set).
const HOUR = 60 * 60 * 1000;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function gymTimeZone() {
  return process.env.GYM_TIMEZONE || 'Asia/Beirut';
}

// "07:30" -> 450 (minutes after midnight)
export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// A Date -> { day: 0-6 (0 = Sunday), minutes: minutes after midnight } in gym time.
export function gymLocalTime(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: gymTimeZone(),
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return { day: DAYS.indexOf(get('weekday')), minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

// True if a 1-hour PT session starting at `startsAt` fits inside one of the
// trainer's weekly windows and starts exactly on the hour.
export function isTrainerAvailable(trainer, startsAt) {
  if (startsAt.getUTCMinutes() !== 0 || startsAt.getUTCSeconds() !== 0 || startsAt.getUTCMilliseconds() !== 0) {
    return false;
  }
  const { day, minutes } = gymLocalTime(startsAt);
  return trainer.weeklyAvailability.some(
    (slot) => slot.day === day && toMinutes(slot.start) <= minutes && minutes + 60 <= toMinutes(slot.end)
  );
}

// Every free 1-hour slot in the next `days` days.
// `takenTimes` is a Set of timestamps (ms) that are already booked.
export function freeSlots(trainer, takenTimes, days = 14, now = new Date()) {
  const slots = [];
  const first = Math.ceil(now.getTime() / HOUR) * HOUR; // next full hour
  const last = now.getTime() + days * 24 * HOUR;
  for (let t = first; t < last; t += HOUR) {
    const start = new Date(t);
    if (!takenTimes.has(t) && isTrainerAvailable(trainer, start)) slots.push(start);
  }
  return slots;
}
