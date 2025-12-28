const STORAGE_KEYS = {
  metrics: 'progress_metrics',
  habits: 'progress_habits',
  journals: 'progress_journals',
  transactions: 'progress_transactions',
  library: 'progress_library',
  readingSessions: 'progress_reading_sessions',
  learningNotes: 'progress_learning_notes',
  srsState: 'progress_srs_state',
  reviews: 'progress_reviews',
  goals: 'progress_goals'
};

const loadData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export { STORAGE_KEYS, loadData, saveData };
