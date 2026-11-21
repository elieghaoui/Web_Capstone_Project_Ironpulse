// IRONPULSE's weekly class timetable, shared by seed.js (full reset)
// and seed-classes.js (only adds upcoming classes).

// Weekly timetable: [weekday (0 = Sunday), "HH:MM", title, category, minutes, spots, trainer, room]
export const timetable = [
  [1, '18:00', 'HIIT Burn', 'HIIT', 45, 20, 'Lea Saad', 'Studio A'],
  [3, '18:00', 'HIIT Burn', 'HIIT', 45, 20, 'Lea Saad', 'Studio A'],
  [2, '19:00', 'Spin Rush', 'Cycling', 45, 16, 'Lea Saad', 'Cycle Room'],
  [4, '19:00', 'Spin Rush', 'Cycling', 45, 16, 'Lea Saad', 'Cycle Room'],
  [0, '10:00', 'Power Yoga', 'Yoga', 60, 18, 'Maya Khoury', 'Studio B'],
  [3, '08:00', 'Power Yoga', 'Yoga', 60, 18, 'Maya Khoury', 'Studio B'],
  [2, '08:00', 'Pilates', 'Pilates', 50, 14, 'Maya Khoury', 'Studio B'],
  [5, '09:00', 'Core & Mobility', 'Mobility', 30, 20, 'Maya Khoury', 'Studio B'],
  [1, '20:00', 'Boxing Fundamentals', 'Boxing', 60, 12, 'Rami Nassar', 'Ring'],
  [6, '12:00', 'Boxing Fundamentals', 'Boxing', 60, 12, 'Rami Nassar', 'Ring'],
  [2, '07:00', 'Strength Lab', 'Strength', 50, 10, 'Karim Haddad', 'Weights Zone'],
  [4, '07:00', 'Strength Lab', 'Strength', 50, 10, 'Karim Haddad', 'Weights Zone'],
];

// Turns the weekly timetable into real dates for the next `weeks` weeks.
export function buildClasses(trainerIds, weeks = 2) {
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let offset = 0; offset < weeks * 7; offset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    for (const [day, time, title, category, durationMin, capacity, trainerName, room] of timetable) {
      if (date.getDay() !== day) continue;
      const [h, m] = time.split(':').map(Number);
      const startsAt = new Date(date);
      startsAt.setHours(h, m, 0, 0);
      result.push({ title, category, durationMin, capacity, room, startsAt, trainerId: trainerIds[trainerName] });
    }
  }
  return result;
}
