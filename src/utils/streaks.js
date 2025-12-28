import { formatDate, getToday } from './date';

const calculateStreak = (habits, key, currentDate = getToday()) => {
  let streak = 0;
  let date = new Date(currentDate);

  while (true) {
    const dateStr = formatDate(date);
    const dayHabits = habits[dateStr];
    if (dayHabits && dayHabits[key] === true) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else if (dateStr === currentDate && !dayHabits?.[key]) {
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

export { calculateStreak };
