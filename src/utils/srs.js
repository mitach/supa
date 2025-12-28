const calculateNextReview = (currentInterval, ease, response) => {
  const multipliers = { again: 0.5, hard: 1.2, good: ease, easy: ease * 1.3 };
  const newEase = Math.max(
    1.3,
    ease + (response === 'easy' ? 0.15 : response === 'again' ? -0.2 : response === 'hard' ? -0.15 : 0)
  );
  const newInterval = Math.max(1, Math.round(currentInterval * multipliers[response]));
  return { interval: newInterval, ease: newEase };
};

export { calculateNextReview };
