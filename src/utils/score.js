const calculateDailyScore = (dayMetrics, dayHabits, goals, dayJournal) => {
  let score = 0;
  let maxScore = 0;
  const breakdown = [];

  const habits = [
    { key: 'nofap', label: 'NoFap', points: 10 },
    { key: 'healthyEating', label: 'Healthy Eating', points: 10 },
  ];

  habits.forEach(({ key, label, points }) => {
    maxScore += points;
    if (dayHabits?.[key]) {
      score += points;
      breakdown.push({ label, earned: points, max: points, percent: 100 });
    } else {
      breakdown.push({ label, earned: 0, max: points, percent: 0 });
    }
  });

  const activityPoints = 10;
  maxScore += activityPoints;
  const didActivity = Boolean(dayHabits?.workout || dayHabits?.run);
  breakdown.push({
    label: 'Workout or Run',
    earned: didActivity ? activityPoints : 0,
    max: activityPoints,
    percent: didActivity ? 100 : 0
  });
  if (didActivity) {
    score += activityPoints;
  }

  const metrics = [
    { key: 'steps', label: 'Steps', goal: goals?.steps || 10000, points: 8 },
    { key: 'water', label: 'Water', goal: goals?.water || 1.5, points: 8 },
    { key: 'sleep', label: 'Sleep', goal: goals?.sleep || 7.5, points: 8 },
    { key: 'pages', label: 'Reading', goal: goals?.pages || 20, points: 8 },
    { key: 'pushups', label: 'Push-ups', goal: goals?.pushups || 50, points: 8 },
    { key: 'squats', label: 'Squats', goal: goals?.squats || 50, points: 8 },
  ];

  metrics.forEach(({ key, label, goal, points }) => {
    maxScore += points;
    const value = dayMetrics?.[key] || 0;
    const percent = Math.min(100, (value / goal) * 100);
    const earned = Math.round((percent / 100) * points * 10) / 10;
    score += earned;
    breakdown.push({ label, earned, max: points, percent: Math.round(percent), value, goal });
  });

  if (dayJournal?.text && dayJournal.text.length > 50) {
    const bonusPoints = Math.min(5, Math.floor(dayJournal.text.length / 100));
    score += bonusPoints;
    if (bonusPoints > 0) {
      breakdown.push({
        label: 'Journal Bonus',
        earned: bonusPoints,
        max: 5,
        percent: (bonusPoints / 5) * 100,
        isBonus: true
      });
    }
  }

  const safeMax = maxScore || 1;
  const scale = 100 / safeMax;
  const scaledScore = Math.round(score * scale);
  const scaledBreakdown = breakdown.map(item => ({
    ...item,
    earned: Math.round((item.earned || 0) * scale * 10) / 10,
    max: item.max ? Math.round(item.max * scale * 10) / 10 : item.max
  }));
  return {
    score: scaledScore,
    maxScore: 100,
    percent: Math.round((score / safeMax) * 100),
    breakdown: scaledBreakdown,
    grade: scaledScore >= 90 ? 'S' : scaledScore >= 80 ? 'A' : scaledScore >= 70 ? 'B' : scaledScore >= 60 ? 'C' : scaledScore >= 50 ? 'D' : 'F'
  };
};

export { calculateDailyScore };
