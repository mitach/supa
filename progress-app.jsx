import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Tooltip, AreaChart, Area } from 'recharts';

// ============================================
// UTILITY FUNCTIONS
// ============================================

const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const getToday = () => formatDate(new Date());

const getDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatDate(d);
};

const getWeekStart = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return formatDate(d);
};

const getMonthStart = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

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

const generateId = () => Math.random().toString(36).substr(2, 9);

// SRS interval calculation (Anki-lite)
const calculateNextReview = (currentInterval, ease, response) => {
  const multipliers = { again: 0.5, hard: 1.2, good: ease, easy: ease * 1.3 };
  const newEase = Math.max(1.3, ease + (response === 'easy' ? 0.15 : response === 'again' ? -0.2 : response === 'hard' ? -0.15 : 0));
  const newInterval = Math.max(1, Math.round(currentInterval * multipliers[response]));
  return { interval: newInterval, ease: newEase };
};

// Daily Score Calculation
const calculateDailyScore = (dayMetrics, dayHabits, goals, dayJournal) => {
  let score = 0;
  let maxScore = 0;
  const breakdown = [];
  
  // Habits (60 points max - 10 each)
  const habits = [
    { key: 'nofap', label: 'NoFap', points: 10 },
    { key: 'workout', label: 'Workout', points: 10 },
    { key: 'run', label: 'Run', points: 10 },
    { key: 'keptWord', label: 'Kept Word', points: 10 },
    { key: 'hardThing', label: 'Hard Thing', points: 10 },
    { key: 'integrity', label: 'Integrity', points: 10 },
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
  
  // Metrics (40 points max - 8 each)
  const metrics = [
    { key: 'steps', label: 'Steps', goal: goals?.steps || 10000, points: 8 },
    { key: 'water', label: 'Water', goal: goals?.water || 1.5, points: 8 },
    { key: 'sleep', label: 'Sleep', goal: goals?.sleep || 7.5, points: 8 },
    { key: 'pages', label: 'Reading', goal: goals?.pages || 20, points: 8 },
    { key: 'pushups', label: 'Push-ups', goal: goals?.pushups || 50, points: 8 },
  ];
  
  metrics.forEach(({ key, label, goal, points }) => {
    maxScore += points;
    const value = dayMetrics?.[key] || 0;
    const percent = Math.min(100, (value / goal) * 100);
    const earned = Math.round((percent / 100) * points * 10) / 10;
    score += earned;
    breakdown.push({ label, earned, max: points, percent: Math.round(percent), value, goal });
  });
  
  // Bonus points for journaling (up to 5 bonus points)
  if (dayJournal?.text && dayJournal.text.length > 50) {
    const bonusPoints = Math.min(5, Math.floor(dayJournal.text.length / 100));
    score += bonusPoints;
    if (bonusPoints > 0) {
      breakdown.push({ label: 'Journal Bonus', earned: bonusPoints, max: 5, percent: (bonusPoints / 5) * 100, isBonus: true });
    }
  }
  
  return {
    score: Math.round(score),
    maxScore,
    percent: Math.round((score / maxScore) * 100),
    breakdown,
    grade: score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F'
  };
};

// ============================================
// STORAGE
// ============================================

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

const usePersistedState = (key, defaultValue) => {
  const [state, setState] = useState(() => loadData(key) ?? defaultValue);
  
  useEffect(() => {
    saveData(key, state);
  }, [key, state]);
  
  return [state, setState];
};

// ============================================
// ICONS
// ============================================

const Icons = {
  Home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Book: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  Chart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Brain: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M12 2a4 4 0 014 4c0 1.1-.9 2-2 2h-4a2 2 0 01-2-2 4 4 0 014-4z" />
      <path d="M12 8v14" />
      <path d="M8 12h8" />
      <path d="M6 16c-2 0-4-1-4-3s2-3 4-3" />
      <path d="M18 16c2 0 4-1 4-3s-2-3-4-3" />
    </svg>
  ),
  Flame: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
    </svg>
  ),
  Trophy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12,19 5,12 12,5" />
    </svg>
  ),
  Droplet: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
    </svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ),
  Activity: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
    </svg>
  ),
  DollarSign: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  ),
  RefreshCw: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="23,4 23,10 17,10" />
      <polyline points="1,20 1,14 7,14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
  Dumbbell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M6.5 6.5a2 2 0 013 0l8 8a2 2 0 01-3 3l-8-8a2 2 0 010-3z" />
      <path d="M4.5 8.5l-1-1a2 2 0 113-3l1 1" />
      <path d="M15.5 19.5l1 1a2 2 0 103-3l-1-1" />
      <path d="M8.5 4.5l-1-1a2 2 0 10-3 3l1 1" />
      <path d="M19.5 15.5l1 1a2 2 0 113-3l-1-1" />
    </svg>
  ),
};

// ============================================
// COMPONENTS
// ============================================

const MetricInput = ({ label, value, onChange, placeholder, unit, goal, quickAdd }) => {
  const progress = goal && value ? Math.min(100, (value / goal) * 100) : 0;
  
  return (
    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        {goal && (
          <span className="text-xs text-slate-500">
            Goal: {goal}{unit}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={placeholder}
          className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all"
        />
        {unit && <span className="text-slate-500 text-sm">{unit}</span>}
      </div>
      {quickAdd && (
        <div className="flex gap-2 mt-3">
          {quickAdd.map((amount) => (
            <button
              key={amount}
              onClick={() => onChange((value || 0) + amount)}
              className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 text-sm py-2 rounded-lg transition-colors"
            >
              +{amount}
            </button>
          ))}
        </div>
      )}
      {goal && (
        <div className="mt-3">
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-right text-xs text-slate-500 mt-1">
            {Math.round(progress)}%
          </div>
        </div>
      )}
    </div>
  );
};

const HabitToggle = ({ label, value, onChange, streak, icon }) => (
  <button
    onClick={() => onChange(!value)}
    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
      value 
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'
    }`}
  >
    <div className="flex items-center gap-3">
      {icon && <span className="opacity-70">{icon}</span>}
      <span className="font-medium">{label}</span>
    </div>
    <div className="flex items-center gap-3">
      {streak > 0 && (
        <div className="flex items-center gap-1 text-amber-400">
          <Icons.Flame />
          <span className="text-sm font-bold">{streak}</span>
        </div>
      )}
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
        value ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'
      }`}>
        {value && <Icons.Check />}
      </div>
    </div>
  </button>
);

const Card = ({ children, className = '', onClick }) => (
  <div 
    className={`bg-slate-800/50 rounded-2xl border border-slate-700/50 ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden border border-slate-700/50 animate-slideUp">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
          >
            <Icons.X />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', className = '', disabled }) => {
  const variants = {
    primary: 'bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-3 rounded-xl transition-all duration-200 ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

const DailyScoreCard = ({ score, weeklyAvg, lastWeekAvg, onShowBreakdown }) => {
  const diff = weeklyAvg - lastWeekAvg;
  const diffText = diff > 0 ? `+${diff}` : diff.toString();
  const diffColor = diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-400';
  
  const gradeColors = {
    'S': 'from-amber-400 to-yellow-300',
    'A': 'from-emerald-400 to-teal-300',
    'B': 'from-blue-400 to-cyan-300',
    'C': 'from-violet-400 to-purple-300',
    'D': 'from-orange-400 to-amber-300',
    'F': 'from-red-400 to-rose-300',
  };
  
  const gradeEmoji = {
    'S': '🏆',
    'A': '🔥',
    'B': '💪',
    'C': '👍',
    'D': '📈',
    'F': '💭',
  };
  
  const getMessage = (s) => {
    if (s >= 90) return "Legendary day!";
    if (s >= 80) return "Crushing it!";
    if (s >= 70) return "Solid progress!";
    if (s >= 60) return "Good effort!";
    if (s >= 50) return "Keep pushing!";
    return "Tomorrow is a new day";
  };
  
  return (
    <Card 
      className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
      onClick={onShowBreakdown}
    >
      <div className="flex items-center gap-4">
        {/* Score Circle */}
        <div className="relative">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-slate-700"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(score.percent / 100) * 226} 226`}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold bg-gradient-to-r ${gradeColors[score.grade]} bg-clip-text text-transparent`}>
              {score.score}
            </span>
            <span className="text-xs text-slate-500">/ {score.maxScore}</span>
          </div>
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-lg font-bold bg-gradient-to-r ${gradeColors[score.grade]} bg-clip-text text-transparent`}>
              Grade {score.grade}
            </span>
            <span>{gradeEmoji[score.grade]}</span>
          </div>
          <p className="text-slate-400 text-sm mb-2">{getMessage(score.score)}</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Week avg:</span>
            <span className="text-white font-semibold">{weeklyAvg}</span>
            {lastWeekAvg > 0 && (
              <span className={`${diffColor} text-xs`}>({diffText})</span>
            )}
          </div>
        </div>
        
        {/* Tap hint */}
        <div className="text-slate-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </div>
      </div>
    </Card>
  );
};

const ScoreBreakdownModal = ({ isOpen, onClose, score, date }) => {
  if (!isOpen) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Score Breakdown - ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}>
      <div className="space-y-4">
        {/* Overall Score */}
        <div className="text-center py-4 bg-slate-800/50 rounded-xl">
          <div className="text-5xl font-bold text-amber-400 mb-1">{score.score}</div>
          <div className="text-slate-400">out of {score.maxScore} points</div>
        </div>
        
        {/* Habits Section */}
        <div>
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Habits (60 pts max)</h4>
          <div className="space-y-2">
            {score.breakdown.filter(b => !b.goal && !b.isBonus).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-800/30 rounded-lg">
                <span className="text-slate-300">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className={item.earned > 0 ? 'text-emerald-400' : 'text-slate-600'}>
                    {item.earned > 0 ? '✓' : '○'}
                  </span>
                  <span className={`font-semibold ${item.earned > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                    +{item.earned}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Metrics Section */}
        <div>
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Metrics (40 pts max)</h4>
          <div className="space-y-2">
            {score.breakdown.filter(b => b.goal !== undefined).map((item, i) => (
              <div key={i} className="py-2 px-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-amber-400 font-semibold">+{item.earned.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                      style={{ width: `${Math.min(100, item.percent)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-20 text-right">
                    {item.value || 0} / {item.goal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bonus Section */}
        {score.breakdown.filter(b => b.isBonus).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Bonus Points</h4>
            <div className="space-y-2">
              {score.breakdown.filter(b => b.isBonus).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                  <span className="text-violet-300">{item.label}</span>
                  <span className="text-violet-400 font-semibold">+{item.earned}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tips */}
        <div className="bg-slate-800/30 rounded-xl p-4 mt-4">
          <h4 className="text-amber-400 text-sm font-semibold mb-2">💡 Tips to improve</h4>
          <ul className="text-slate-400 text-sm space-y-1">
            {score.breakdown.filter(b => !b.isBonus && b.percent < 100).slice(0, 3).map((item, i) => (
              <li key={i}>• {item.label}: {item.percent < 50 ? 'Not logged or low' : 'Almost there!'}</li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
};

const TabBar = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
          active === tab.id 
            ? 'bg-slate-700 text-white' 
            : 'text-slate-400 hover:text-white'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

// ============================================
// PAGES
// ============================================

const TodayPage = ({ 
  metrics, setMetrics, 
  habits, setHabits, 
  journals, setJournals,
  transactions, setTransactions,
  readingSessions, setReadingSessions,
  library,
  goals
}) => {
  const today = getToday();
  const todayMetrics = metrics[today] || {};
  const todayHabits = habits[today] || {};
  const todayJournal = journals[today] || {};
  
  const [showQuickAdd, setShowQuickAdd] = useState(null);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [journalText, setJournalText] = useState(todayJournal.text || '');
  const [tilText, setTilText] = useState(todayJournal.til || '');
  const [avoidedText, setAvoidedText] = useState(todayJournal.avoided || '');
  
  const updateMetric = (key, value) => {
    setMetrics(prev => ({
      ...prev,
      [today]: { ...prev[today], [key]: value }
    }));
  };
  
  const updateHabit = (key, value) => {
    setHabits(prev => ({
      ...prev,
      [today]: { ...prev[today], [key]: value }
    }));
  };
  
  const saveJournal = () => {
    setJournals(prev => ({
      ...prev,
      [today]: { text: journalText, til: tilText, avoided: avoidedText }
    }));
  };
  
  useEffect(() => {
    const timeout = setTimeout(saveJournal, 500);
    return () => clearTimeout(timeout);
  }, [journalText, tilText, avoidedText]);
  
  const noFapStreak = calculateStreak(habits, 'nofap');
  const workoutStreak = calculateStreak(habits, 'workout');
  
  // Calculate today's totals
  const todaySpend = transactions
    .filter(t => t.date === today && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const todayIncome = transactions
    .filter(t => t.date === today && t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate today's reading
  const todayPages = readingSessions
    .filter(s => s.date === today)
    .reduce((sum, s) => sum + s.pages, 0);
  
  // Calculate daily score
  const dailyScore = useMemo(() => {
    const metricsWithPages = { ...todayMetrics, pages: todayPages || todayMetrics.pages };
    return calculateDailyScore(metricsWithPages, todayHabits, goals, todayJournal);
  }, [todayMetrics, todayHabits, goals, todayJournal, todayPages]);
  
  // Calculate weekly averages
  const { weeklyAvg, lastWeekAvg } = useMemo(() => {
    let thisWeekTotal = 0;
    let thisWeekCount = 0;
    let lastWeekTotal = 0;
    let lastWeekCount = 0;
    
    for (let i = 0; i < 14; i++) {
      const date = getDaysAgo(i);
      const dayMetrics = metrics[date] || {};
      const dayHabits = habits[date] || {};
      const dayJournal = journals[date] || {};
      
      // Only count days with some data
      if (Object.keys(dayMetrics).length > 0 || Object.keys(dayHabits).length > 0) {
        const score = calculateDailyScore(dayMetrics, dayHabits, goals, dayJournal);
        
        if (i < 7) {
          thisWeekTotal += score.score;
          thisWeekCount++;
        } else {
          lastWeekTotal += score.score;
          lastWeekCount++;
        }
      }
    }
    
    return {
      weeklyAvg: thisWeekCount > 0 ? Math.round(thisWeekTotal / thisWeekCount) : 0,
      lastWeekAvg: lastWeekCount > 0 ? Math.round(lastWeekTotal / lastWeekCount) : 0
    };
  }, [metrics, habits, journals, goals]);
  
  // Generate daily summary
  const generateSummary = () => {
    const parts = [];
    
    // Body
    const bodyParts = [];
    if (todayMetrics.sleep) bodyParts.push(`${todayMetrics.sleep}h sleep`);
    if (todayMetrics.steps) bodyParts.push(`${todayMetrics.steps.toLocaleString()} steps`);
    if (todayMetrics.water) bodyParts.push(`${todayMetrics.water}L water`);
    if (bodyParts.length) parts.push(`Body: ${bodyParts.join(', ')}`);
    
    // Mind
    const mindParts = [];
    if (todayPages > 0) mindParts.push(`${todayPages} pages`);
    if (tilText) mindParts.push('learned something');
    if (mindParts.length) parts.push(`Mind: ${mindParts.join(', ')}`);
    
    // Discipline
    const discParts = [];
    if (todayHabits.nofap) discParts.push(`NoFap day ${noFapStreak}`);
    if (todayHabits.workout) discParts.push('workout ✓');
    if (todayHabits.run) discParts.push('run ✓');
    if (todayHabits.integrity) discParts.push('integrity ✓');
    if (discParts.length) parts.push(`Discipline: ${discParts.join(', ')}`);
    
    return parts.length ? parts.join('. ') + '.' : 'No data logged yet.';
  };
  
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold text-white mb-1">Today</h1>
        <p className="text-slate-400 text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>
      
      {/* Daily Score Card */}
      <DailyScoreCard 
        score={dailyScore}
        weeklyAvg={weeklyAvg}
        lastWeekAvg={lastWeekAvg}
        onShowBreakdown={() => setShowScoreBreakdown(true)}
      />
      
      {/* Score Breakdown Modal */}
      <ScoreBreakdownModal 
        isOpen={showScoreBreakdown}
        onClose={() => setShowScoreBreakdown(false)}
        score={dailyScore}
        date={today}
      />
      
      {/* Streak Banner */}
      {noFapStreak > 0 && (
        <Card className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Icons.Flame />
              </div>
              <div>
                <div className="text-amber-400 font-bold text-2xl">{noFapStreak} days</div>
                <div className="text-slate-400 text-sm">NoFap streak</div>
              </div>
            </div>
            <Icons.Trophy />
          </div>
        </Card>
      )}
      
      {/* Core Metrics */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Core Metrics</h2>
        <div className="grid gap-3">
          <MetricInput
            label="Steps"
            value={todayMetrics.steps}
            onChange={(v) => updateMetric('steps', v)}
            placeholder="0"
            goal={goals?.steps || 10000}
            icon={<Icons.Activity />}
          />
          <MetricInput
            label="Water"
            value={todayMetrics.water}
            onChange={(v) => updateMetric('water', v)}
            placeholder="0"
            unit="L"
            goal={goals?.water || 1.5}
            quickAdd={[0.25, 0.5, 1]}
          />
          <MetricInput
            label="Sleep"
            value={todayMetrics.sleep}
            onChange={(v) => updateMetric('sleep', v)}
            placeholder="0"
            unit="hours"
            goal={goals?.sleep || 7.5}
          />
          <MetricInput
            label="Pages Read"
            value={todayPages || todayMetrics.pages}
            onChange={(v) => updateMetric('pages', v)}
            placeholder="0"
          />
          <MetricInput
            label="Push-ups"
            value={todayMetrics.pushups}
            onChange={(v) => updateMetric('pushups', v)}
            placeholder="0"
            quickAdd={[10, 20, 50]}
          />
        </div>
      </div>
      
      {/* Money Quick Entry */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Money</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="text-slate-400 text-sm mb-1">Spent Today</div>
            <div className="text-2xl font-bold text-red-400">${todaySpend.toFixed(2)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-slate-400 text-sm mb-1">Earned Today</div>
            <div className="text-2xl font-bold text-emerald-400">${todayIncome.toFixed(2)}</div>
          </Card>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={() => setShowQuickAdd('transaction')}
          >
            <span className="flex items-center justify-center gap-2">
              <Icons.Plus /> Add Transaction
            </span>
          </Button>
          <Button 
            variant="ghost" 
            className="w-full border border-slate-700"
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'money' }))}
          >
            <span className="flex items-center justify-center gap-2">
              <Icons.Chart /> View Details
            </span>
          </Button>
        </div>
      </div>
      
      {/* Discipline Habits */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Discipline</h2>
        <div className="space-y-2">
          <HabitToggle 
            label="NoFap - Clean today"
            value={todayHabits.nofap}
            onChange={(v) => updateHabit('nofap', v)}
            streak={noFapStreak}
          />
          <HabitToggle 
            label="Workout"
            value={todayHabits.workout}
            onChange={(v) => updateHabit('workout', v)}
            streak={workoutStreak}
          />
          <HabitToggle 
            label="Run"
            value={todayHabits.run}
            onChange={(v) => updateHabit('run', v)}
          />
          <HabitToggle 
            label="Kept my word"
            value={todayHabits.keptWord}
            onChange={(v) => updateHabit('keptWord', v)}
          />
          <HabitToggle 
            label="Did a hard thing voluntarily"
            value={todayHabits.hardThing}
            onChange={(v) => updateHabit('hardThing', v)}
          />
          <HabitToggle 
            label="Acted with integrity"
            value={todayHabits.integrity}
            onChange={(v) => updateHabit('integrity', v)}
          />
        </div>
      </div>
      
      {/* Quick Text Inputs */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Quick Notes</h2>
        <Card className="p-4">
          <label className="text-slate-400 text-sm mb-2 block">Today I Learned</label>
          <textarea
            value={tilText}
            onChange={(e) => setTilText(e.target.value)}
            placeholder="What did you learn today?"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50 transition-all"
            rows={2}
          />
        </Card>
        <Card className="p-4">
          <label className="text-slate-400 text-sm mb-2 block">Avoided something important?</label>
          <textarea
            value={avoidedText}
            onChange={(e) => setAvoidedText(e.target.value)}
            placeholder="What did you avoid?"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50 transition-all"
            rows={2}
          />
        </Card>
      </div>
      
      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setShowQuickAdd('reading')}>
            <span className="flex items-center justify-center gap-2">
              <Icons.Book /> Reading
            </span>
          </Button>
          <Button variant="secondary" onClick={() => setShowQuickAdd('library')}>
            <span className="flex items-center justify-center gap-2">
              <Icons.Plus /> Library
            </span>
          </Button>
        </div>
      </div>
      
      {/* Daily Summary */}
      <Card className="p-4 bg-slate-800/30">
        <h3 className="text-slate-400 text-sm font-medium mb-2">Daily Summary</h3>
        <p className="text-slate-300 text-sm leading-relaxed">
          {generateSummary()}
        </p>
      </Card>
      
      {/* Transaction Modal */}
      <Modal 
        isOpen={showQuickAdd === 'transaction'} 
        onClose={() => setShowQuickAdd(null)}
        title="Add Transaction"
      >
        <TransactionForm 
          onSave={(t) => {
            setTransactions(prev => [...prev, { ...t, id: generateId(), date: today }]);
            setShowQuickAdd(null);
          }}
        />
      </Modal>
      
      {/* Reading Session Modal */}
      <Modal 
        isOpen={showQuickAdd === 'reading'} 
        onClose={() => setShowQuickAdd(null)}
        title="Add Reading Session"
      >
        <ReadingSessionForm 
          books={library.filter(i => i.type === 'book' && i.status === 'in_progress')}
          onSave={(s) => {
            setReadingSessions(prev => [...prev, { ...s, id: generateId(), date: today }]);
            setShowQuickAdd(null);
          }}
        />
      </Modal>
    </div>
  );
};

const TransactionForm = ({ onSave, onDelete, initial, showDatePicker }) => {
  const [amount, setAmount] = useState(initial?.amount || '');
  const [type, setType] = useState(initial?.type || 'expense');
  const [category, setCategory] = useState(initial?.category || '');
  const [note, setNote] = useState(initial?.note || '');
  const [date, setDate] = useState(initial?.date || getToday());
  
  const categories = {
    expense: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Rent', 'Subscriptions', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Bonus', 'Refund', 'Other']
  };
  
  return (
    <div className="space-y-4">
      <TabBar 
        tabs={[{ id: 'expense', label: 'Expense' }, { id: 'income', label: 'Income' }]}
        active={type}
        onChange={setType}
      />
      {showDatePicker && (
        <div>
          <label className="text-slate-400 text-sm mb-2 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
      )}
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-2xl font-bold focus:outline-none focus:border-amber-500/50"
        />
      </div>
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Category</label>
        <div className="flex flex-wrap gap-2">
          {categories[type].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                category === cat 
                  ? 'bg-amber-500 text-slate-900 font-semibold' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
        />
      </div>
      <div className="flex gap-3">
        {onDelete && (
          <Button variant="danger" onClick={onDelete} className="flex-1">
            Delete
          </Button>
        )}
        <Button 
          className="flex-1" 
          onClick={() => amount && onSave({ amount: Number(amount), type, category, note, date })}
          disabled={!amount}
        >
          Save Transaction
        </Button>
      </div>
    </div>
  );
};

const ReadingSessionForm = ({ books, onSave }) => {
  const [bookId, setBookId] = useState(books[0]?.id || '');
  const [pages, setPages] = useState('');
  
  return (
    <div className="space-y-4">
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Book</label>
        {books.length > 0 ? (
          <select
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
          >
            {books.map((book) => (
              <option key={book.id} value={book.id}>{book.title}</option>
            ))}
          </select>
        ) : (
          <p className="text-slate-500 text-sm">No books in progress. Add one in Library first.</p>
        )}
      </div>
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Pages Read</label>
        <input
          type="number"
          value={pages}
          onChange={(e) => setPages(e.target.value)}
          placeholder="0"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-2xl font-bold focus:outline-none focus:border-amber-500/50"
        />
      </div>
      <Button 
        className="w-full" 
        onClick={() => pages && bookId && onSave({ bookId, pages: Number(pages) })}
        disabled={!pages || !bookId}
      >
        Save Session
      </Button>
    </div>
  );
};

const LogPage = ({ metrics, habits, journals, setJournals, goals }) => {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const dayMetrics = metrics[selectedDate] || {};
  const dayHabits = habits[selectedDate] || {};
  const dayJournal = journals[selectedDate] || {};
  
  // Calculate score for selected day
  const dayScore = useMemo(() => {
    return calculateDailyScore(dayMetrics, dayHabits, goals, dayJournal);
  }, [dayMetrics, dayHabits, goals, dayJournal]);
  
  const dates = useMemo(() => {
    const result = [];
    for (let i = 0; i < 30; i++) {
      result.push(getDaysAgo(i));
    }
    return result;
  }, []);
  
  const hasData = (date) => {
    return metrics[date] || habits[date] || journals[date];
  };
  
  // Get score for a date (for the calendar)
  const getDateScore = (date) => {
    const m = metrics[date] || {};
    const h = habits[date] || {};
    const j = journals[date] || {};
    if (!metrics[date] && !habits[date]) return null;
    return calculateDailyScore(m, h, goals, j).score;
  };
  
  return (
    <div className="space-y-6 pb-24">
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold text-white mb-1">Daily Log</h1>
        <p className="text-slate-400 text-sm">View and edit past entries</p>
      </div>
      
      {/* Date Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
        {dates.map((date) => {
          const d = new Date(date);
          const isToday = date === getToday();
          const isSelected = date === selectedDate;
          const logged = hasData(date);
          const score = getDateScore(date);
          
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 w-14 py-3 rounded-xl text-center transition-all ${
                isSelected 
                  ? 'bg-amber-500 text-slate-900' 
                  : logged 
                    ? 'bg-slate-700 text-white' 
                    : 'bg-slate-800/50 text-slate-500'
              }`}
            >
              <div className="text-xs opacity-70">
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-lg font-bold">{d.getDate()}</div>
              {score !== null && !isSelected && (
                <div className={`text-xs font-medium ${
                  score >= 70 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {score}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Selected Day Data */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">
            {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          {hasData(selectedDate) && (
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
              dayScore.score >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
              dayScore.score >= 50 ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-700 text-slate-400'
            }`}>
              {dayScore.score} pts
            </div>
          )}
        </div>
        
        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { key: 'steps', label: 'Steps', icon: <Icons.Activity /> },
            { key: 'water', label: 'Water', unit: 'L', icon: <Icons.Droplet /> },
            { key: 'sleep', label: 'Sleep', unit: 'h', icon: <Icons.Moon /> },
            { key: 'pages', label: 'Pages', icon: <Icons.Book /> },
            { key: 'pushups', label: 'Push-ups', icon: <Icons.Dumbbell /> },
          ].map(({ key, label, unit, icon }) => (
            <div key={key} className="bg-slate-900/50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                {icon} {label}
              </div>
              <div className="text-xl font-bold text-white">
                {dayMetrics[key] ?? '—'}{unit && dayMetrics[key] ? unit : ''}
              </div>
            </div>
          ))}
        </div>
        
        {/* Habits */}
        <div className="space-y-2 mb-4">
          {[
            { key: 'nofap', label: 'NoFap' },
            { key: 'workout', label: 'Workout' },
            { key: 'run', label: 'Run' },
            { key: 'keptWord', label: 'Kept Word' },
            { key: 'hardThing', label: 'Hard Thing' },
            { key: 'integrity', label: 'Integrity' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
              <span className="text-slate-300">{label}</span>
              <span className={dayHabits[key] ? 'text-emerald-400' : 'text-slate-600'}>
                {dayHabits[key] ? '✓ Yes' : '—'}
              </span>
            </div>
          ))}
        </div>
        
        {/* Journal */}
        {dayJournal.text && (
          <div className="bg-slate-900/50 rounded-xl p-4 mb-3">
            <div className="text-slate-400 text-sm mb-2">Journal</div>
            <p className="text-white">{dayJournal.text}</p>
          </div>
        )}
        {dayJournal.til && (
          <div className="bg-slate-900/50 rounded-xl p-4 mb-3">
            <div className="text-slate-400 text-sm mb-2">Learned</div>
            <p className="text-white">{dayJournal.til}</p>
          </div>
        )}
        {dayJournal.avoided && (
          <div className="bg-slate-900/50 rounded-xl p-4">
            <div className="text-slate-400 text-sm mb-2">Avoided</div>
            <p className="text-white">{dayJournal.avoided}</p>
          </div>
        )}
        
        {!hasData(selectedDate) && (
          <div className="text-center py-8 text-slate-500">
            No data logged for this day
          </div>
        )}
      </Card>
    </div>
  );
};

const JournalPage = ({ journals, setJournals }) => {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [text, setText] = useState(journals[selectedDate]?.text || '');
  
  useEffect(() => {
    setText(journals[selectedDate]?.text || '');
  }, [selectedDate, journals]);
  
  const saveJournal = () => {
    setJournals(prev => ({
      ...prev,
      [selectedDate]: { ...prev[selectedDate], text }
    }));
  };
  
  useEffect(() => {
    const timeout = setTimeout(saveJournal, 500);
    return () => clearTimeout(timeout);
  }, [text]);
  
  const journalDates = Object.keys(journals).filter(d => journals[d]?.text).sort().reverse();
  
  return (
    <div className="space-y-6 pb-24">
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold text-white mb-1">Journal</h1>
        <p className="text-slate-400 text-sm">Free writing and reflection</p>
      </div>
      
      <Card className="p-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4 focus:outline-none focus:border-amber-500/50"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind today?"
          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
          rows={10}
        />
        <div className="text-right text-slate-500 text-sm mt-2">
          {text.split(/\s+/).filter(Boolean).length} words
        </div>
      </Card>
      
      {journalDates.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Past Entries</h2>
          {journalDates.slice(0, 10).map((date) => (
            <Card 
              key={date}
              className="p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
              onClick={() => setSelectedDate(date)}
            >
              <div className="text-amber-400 text-sm mb-2">
                {new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <p className="text-slate-300 line-clamp-2">
                {journals[date].text}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const MoneyPage = ({ transactions, setTransactions }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Get all unique months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set();
    const now = new Date();
    // Add current month
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    // Add months from transactions
    transactions.forEach(t => {
      if (t.date) {
        months.add(t.date.substring(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);
  
  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const monthTransactions = transactions.filter(t => t.date?.startsWith(selectedMonth));
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const net = income - expenses;
    const savingsRate = income > 0 ? ((net / income) * 100).toFixed(0) : 0;
    
    // Category breakdown for expenses
    const categoryBreakdown = {};
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'Other';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + t.amount;
      });
    
    // Sort categories by amount
    const sortedCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1]);
    
    // Income breakdown
    const incomeBreakdown = {};
    monthTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const cat = t.category || 'Other';
        incomeBreakdown[cat] = (incomeBreakdown[cat] || 0) + t.amount;
      });
    
    const sortedIncome = Object.entries(incomeBreakdown)
      .sort((a, b) => b[1] - a[1]);
    
    return {
      income,
      expenses,
      net,
      savingsRate,
      sortedCategories,
      sortedIncome,
      transactionCount: monthTransactions.length
    };
  }, [transactions, selectedMonth]);
  
  // Calculate yearly overview
  const yearlyStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearTransactions = transactions.filter(t => t.date?.startsWith(String(currentYear)));
    
    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      const monthStr = `${currentYear}-${String(month).padStart(2, '0')}`;
      const monthTx = yearTransactions.filter(t => t.date?.startsWith(monthStr));
      
      const income = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      monthlyData.push({
        month: new Date(currentYear, month - 1).toLocaleDateString('en-US', { month: 'short' }),
        monthKey: monthStr,
        income,
        expenses,
        net: income - expenses
      });
    }
    
    const totalIncome = yearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = yearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      monthlyData,
      totalIncome,
      totalExpenses,
      totalNet: totalIncome - totalExpenses,
      avgMonthlyIncome: totalIncome / 12,
      avgMonthlyExpenses: totalExpenses / 12
    };
  }, [transactions]);
  
  // Get transactions for selected month
  const monthTransactions = useMemo(() => {
    return transactions
      .filter(t => t.date?.startsWith(selectedMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth]);
  
  const formatMonthLabel = (monthStr) => {
    const [year, month] = monthStr.split('-');
    return new Date(year, parseInt(month) - 1).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };
  
  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setEditTransaction(null);
  };
  
  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Money</h1>
          <p className="text-slate-400 text-sm">Track income & expenses</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Icons.Plus />
        </Button>
      </div>
      
      {/* Month Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
        {availableMonths.map((month) => (
          <button
            key={month}
            onClick={() => setSelectedMonth(month)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm transition-all ${
              selectedMonth === month 
                ? 'bg-amber-500 text-slate-900 font-semibold' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {formatMonthLabel(month)}
          </button>
        ))}
      </div>
      
      {/* Monthly Summary */}
      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-3">{formatMonthLabel(selectedMonth)}</h3>
        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <div>
            <div className="text-emerald-400 text-2xl font-bold">${monthlyStats.income.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">Income</div>
          </div>
          <div>
            <div className="text-red-400 text-2xl font-bold">${monthlyStats.expenses.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">Expenses</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${monthlyStats.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {monthlyStats.net >= 0 ? '+' : '-'}${Math.abs(monthlyStats.net).toFixed(0)}
            </div>
            <div className="text-slate-500 text-xs">{monthlyStats.net >= 0 ? 'Saved' : 'Overspent'}</div>
          </div>
        </div>
        
        {/* Savings Indicator */}
        {monthlyStats.income > 0 && (
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Savings Rate</span>
              <span className={`font-semibold ${monthlyStats.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {monthlyStats.savingsRate}%
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  monthlyStats.net >= 0 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                    : 'bg-gradient-to-r from-red-500 to-red-400'
                }`}
                style={{ width: `${Math.min(100, Math.abs(monthlyStats.savingsRate))}%` }}
              />
            </div>
            <div className="text-center mt-2 text-sm">
              {monthlyStats.net >= 0 ? (
                <span className="text-emerald-400">🎉 You saved ${monthlyStats.net.toFixed(2)} this month!</span>
              ) : (
                <span className="text-red-400">⚠️ You overspent by ${Math.abs(monthlyStats.net).toFixed(2)}</span>
              )}
            </div>
          </div>
        )}
      </Card>
      
      {/* Expense Breakdown */}
      {monthlyStats.sortedCategories.length > 0 && (
        <Card className="p-4">
          <h3 className="text-slate-400 text-sm mb-3">Expense Breakdown</h3>
          <div className="space-y-3">
            {monthlyStats.sortedCategories.map(([category, amount]) => {
              const percentage = (amount / monthlyStats.expenses) * 100;
              return (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{category}</span>
                    <span className="text-slate-400">${amount.toFixed(0)} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      
      {/* Income Breakdown */}
      {monthlyStats.sortedIncome.length > 0 && (
        <Card className="p-4">
          <h3 className="text-slate-400 text-sm mb-3">Income Sources</h3>
          <div className="space-y-3">
            {monthlyStats.sortedIncome.map(([category, amount]) => {
              const percentage = (amount / monthlyStats.income) * 100;
              return (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{category}</span>
                    <span className="text-slate-400">${amount.toFixed(0)} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      
      {/* Yearly Overview Chart */}
      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-3">Yearly Overview ({new Date().getFullYear()})</h3>
        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <div>
            <div className="text-emerald-400 text-lg font-bold">${yearlyStats.totalIncome.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">Total Income</div>
          </div>
          <div>
            <div className="text-red-400 text-lg font-bold">${yearlyStats.totalExpenses.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">Total Expenses</div>
          </div>
          <div>
            <div className={`text-lg font-bold ${yearlyStats.totalNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${Math.abs(yearlyStats.totalNet).toFixed(0)}
            </div>
            <div className="text-slate-500 text-xs">{yearlyStats.totalNet >= 0 ? 'Net Saved' : 'Net Loss'}</div>
          </div>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyStats.monthlyData} barGap={0}>
              <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(value, name) => [`$${value.toFixed(0)}`, name.charAt(0).toUpperCase() + name.slice(1)]}
              />
              <Bar dataKey="income" fill="#10b981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            <span className="text-slate-400 text-xs">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-slate-400 text-xs">Expenses</span>
          </div>
        </div>
      </Card>
      
      {/* Monthly Net Trend */}
      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-3">Monthly Savings Trend</h3>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yearlyStats.monthlyData}>
              <defs>
                <linearGradient id="netGradientPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                formatter={(value) => [`$${value.toFixed(0)}`, 'Net']}
              />
              <Area 
                type="monotone" 
                dataKey="net" 
                stroke="#10b981" 
                fill="url(#netGradientPos)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      {/* Transaction List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
          Transactions ({monthTransactions.length})
        </h2>
        {monthTransactions.map((t) => (
          <Card 
            key={t.id}
            className="p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
            onClick={() => setEditTransaction(t)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                  </span>
                  {t.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {t.category}
                    </span>
                  )}
                </div>
                {t.note && <p className="text-slate-400 text-sm mt-1">{t.note}</p>}
              </div>
              <div className="text-slate-500 text-sm">
                {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </Card>
        ))}
        
        {monthTransactions.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No transactions this month. Add your first one!
          </div>
        )}
      </div>
      
      {/* Add Transaction Modal */}
      <Modal 
        isOpen={showAdd} 
        onClose={() => setShowAdd(false)}
        title="Add Transaction"
      >
        <TransactionForm 
          onSave={(t) => {
            setTransactions(prev => [...prev, { ...t, id: generateId(), date: t.date || getToday() }]);
            setShowAdd(false);
          }}
          showDatePicker={true}
        />
      </Modal>
      
      {/* Edit Transaction Modal */}
      <Modal 
        isOpen={!!editTransaction} 
        onClose={() => setEditTransaction(null)}
        title="Edit Transaction"
      >
        {editTransaction && (
          <TransactionForm 
            initial={editTransaction}
            onSave={(t) => {
              setTransactions(prev => prev.map(tx => 
                tx.id === editTransaction.id ? { ...tx, ...t } : tx
              ));
              setEditTransaction(null);
            }}
            onDelete={() => deleteTransaction(editTransaction.id)}
            showDatePicker={true}
          />
        )}
      </Modal>
    </div>
  );
};

const LibraryPage = ({ library, setLibrary, readingSessions }) => {
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  const types = ['all', 'book', 'movie', 'series', 'article', 'course', 'podcast'];
  
  const filteredItems = library.filter(item => 
    filter === 'all' || item.type === filter
  );
  
  const getItemPages = (itemId) => {
    return readingSessions
      .filter(s => s.bookId === itemId)
      .reduce((sum, s) => sum + s.pages, 0);
  };
  
  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Library</h1>
          <p className="text-slate-400 text-sm">{library.length} items</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Icons.Plus />
        </Button>
      </div>
      
      {/* Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm capitalize transition-all ${
              filter === type 
                ? 'bg-amber-500 text-slate-900 font-semibold' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      
      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <Card 
            key={item.id}
            className="p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
            onClick={() => setEditItem(item)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 capitalize">
                    {item.type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === 'finished' 
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : item.status === 'in_progress'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-600 text-slate-400'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                {item.type === 'book' && (
                  <p className="text-slate-500 text-sm">
                    {getItemPages(item.id)} pages read
                  </p>
                )}
                {item.rating && (
                  <div className="text-amber-400 text-sm mt-1">
                    {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
        
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No items in library. Add your first one!
          </div>
        )}
      </div>
      
      {/* Add/Edit Modal */}
      <Modal 
        isOpen={showAdd || !!editItem} 
        onClose={() => { setShowAdd(false); setEditItem(null); }}
        title={editItem ? 'Edit Item' : 'Add to Library'}
      >
        <LibraryForm 
          initial={editItem}
          onSave={(item) => {
            if (editItem) {
              setLibrary(prev => prev.map(i => i.id === editItem.id ? { ...i, ...item } : i));
            } else {
              setLibrary(prev => [...prev, { ...item, id: generateId() }]);
            }
            setShowAdd(false);
            setEditItem(null);
          }}
          onDelete={editItem ? () => {
            setLibrary(prev => prev.filter(i => i.id !== editItem.id));
            setEditItem(null);
          } : undefined}
        />
      </Modal>
    </div>
  );
};

const LibraryForm = ({ initial, onSave, onDelete }) => {
  const [type, setType] = useState(initial?.type || 'book');
  const [title, setTitle] = useState(initial?.title || '');
  const [status, setStatus] = useState(initial?.status || 'planned');
  const [rating, setRating] = useState(initial?.rating || 0);
  const [tags, setTags] = useState(initial?.tags || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  
  const types = ['book', 'movie', 'series', 'article', 'course', 'podcast'];
  const statuses = ['planned', 'in_progress', 'finished'];
  
  return (
    <div className="space-y-4">
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Type</label>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${
                type === t 
                  ? 'bg-amber-500 text-slate-900 font-semibold' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
        />
      </div>
      
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Status</label>
        <div className="flex gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm capitalize transition-all ${
                status === s 
                  ? 'bg-amber-500 text-slate-900 font-semibold' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setRating(rating === r ? 0 : r)}
              className={`text-2xl transition-all ${
                r <= rating ? 'text-amber-400' : 'text-slate-600'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Tags</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="fiction, self-help, sci-fi..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
        />
      </div>
      
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Notes / Takeaways</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Your thoughts..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
          rows={4}
        />
      </div>
      
      <div className="flex gap-3">
        {onDelete && (
          <Button variant="danger" onClick={onDelete} className="flex-1">
            Delete
          </Button>
        )}
        <Button 
          className="flex-1" 
          onClick={() => title && onSave({ type, title, status, rating, tags, notes })}
          disabled={!title}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

const LearningPage = ({ learningNotes, setLearningNotes, srsState, setSrsState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  
  const today = getToday();
  
  // Get notes due for review
  const dueNotes = useMemo(() => {
    return learningNotes.filter(note => {
      const state = srsState[note.id];
      if (!state) return true; // New note
      return state.nextReviewAt <= today;
    });
  }, [learningNotes, srsState, today]);
  
  const handleReview = (noteId, response) => {
    const currentState = srsState[noteId] || { interval: 1, ease: 2.5 };
    const { interval, ease } = calculateNextReview(currentState.interval, currentState.ease, response);
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    
    setSrsState(prev => ({
      ...prev,
      [noteId]: {
        interval,
        ease,
        nextReviewAt: formatDate(nextDate),
        lastReviewedAt: today
      }
    }));
  };
  
  if (reviewMode && dueNotes.length > 0) {
    const currentNote = dueNotes[0];
    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setReviewMode(false)} className="text-slate-400">
            <Icons.ArrowLeft />
          </button>
          <span className="text-slate-400 text-sm">{dueNotes.length} cards remaining</span>
        </div>
        
        <Card className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">{currentNote.title}</h2>
          <p className="text-slate-300 whitespace-pre-wrap">{currentNote.body}</p>
          {currentNote.tags && (
            <div className="flex flex-wrap gap-2 mt-4">
              {currentNote.tags.split(',').map((tag, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </Card>
        
        <div className="grid grid-cols-4 gap-2">
          {['again', 'hard', 'good', 'easy'].map((response) => (
            <Button
              key={response}
              variant={response === 'again' ? 'danger' : 'secondary'}
              onClick={() => handleReview(currentNote.id, response)}
              className="capitalize"
            >
              {response}
            </Button>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Learning</h1>
          <p className="text-slate-400 text-sm">{learningNotes.length} notes</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Icons.Plus />
        </Button>
      </div>
      
      {/* Review Button */}
      {dueNotes.length > 0 && (
        <Card 
          className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20 cursor-pointer"
          onClick={() => setReviewMode(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
                <Icons.Brain />
              </div>
              <div>
                <div className="text-white font-semibold">{dueNotes.length} cards to review</div>
                <div className="text-slate-400 text-sm">Tap to start session</div>
              </div>
            </div>
            <Icons.RefreshCw />
          </div>
        </Card>
      )}
      
      {/* Notes List */}
      <div className="space-y-3">
        {learningNotes.map((note) => {
          const state = srsState[note.id];
          return (
            <Card 
              key={note.id}
              className="p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
              onClick={() => setEditNote(note)}
            >
              <h3 className="font-semibold text-white mb-1">{note.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-2">{note.body}</p>
              {state && (
                <div className="text-xs text-slate-500 mt-2">
                  Next review: {state.nextReviewAt}
                </div>
              )}
            </Card>
          );
        })}
        
        {learningNotes.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No learning notes yet. Add your first one!
          </div>
        )}
      </div>
      
      {/* Add/Edit Modal */}
      <Modal 
        isOpen={showAdd || !!editNote} 
        onClose={() => { setShowAdd(false); setEditNote(null); }}
        title={editNote ? 'Edit Note' : 'Add Learning Note'}
      >
        <LearningNoteForm 
          initial={editNote}
          onSave={(note) => {
            if (editNote) {
              setLearningNotes(prev => prev.map(n => n.id === editNote.id ? { ...n, ...note } : n));
            } else {
              setLearningNotes(prev => [...prev, { ...note, id: generateId() }]);
            }
            setShowAdd(false);
            setEditNote(null);
          }}
          onDelete={editNote ? () => {
            setLearningNotes(prev => prev.filter(n => n.id !== editNote.id));
            setEditNote(null);
          } : undefined}
        />
      </Modal>
    </div>
  );
};

const LearningNoteForm = ({ initial, onSave, onDelete }) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [body, setBody] = useState(initial?.body || '');
  const [tags, setTags] = useState(initial?.tags || '');
  const [source, setSource] = useState(initial?.source || '');
  
  return (
    <div className="space-y-4">
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Title / Question</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What did you learn?"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
        />
      </div>
      
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Content / Answer</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Explain the concept..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
          rows={6}
        />
      </div>
      
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Tags</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="programming, psychology, health..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
        />
      </div>
      
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Source (optional)</label>
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Book, course, article..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
        />
      </div>
      
      <div className="flex gap-3">
        {onDelete && (
          <Button variant="danger" onClick={onDelete} className="flex-1">
            Delete
          </Button>
        )}
        <Button 
          className="flex-1" 
          onClick={() => title && body && onSave({ title, body, tags, source })}
          disabled={!title || !body}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

const AnalyticsPage = ({ metrics, habits, transactions, goals }) => {
  const [range, setRange] = useState('week');
  
  const rangeConfig = {
    week: { days: 7, label: 'This Week' },
    month: { days: 30, label: 'This Month' },
    quarter: { days: 90, label: 'Last 90 Days' }
  };
  
  // Prepare chart data
  const chartData = useMemo(() => {
    const days = rangeConfig[range].days;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = getDaysAgo(i);
      const dayMetrics = metrics[date] || {};
      const dayHabits = habits[date] || {};
      
      data.push({
        date,
        label: new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        steps: dayMetrics.steps || 0,
        water: dayMetrics.water || 0,
        sleep: dayMetrics.sleep || 0,
        pages: dayMetrics.pages || 0,
        pushups: dayMetrics.pushups || 0,
        nofap: dayHabits.nofap ? 1 : 0,
        workout: dayHabits.workout ? 1 : 0,
        score: calculateDailyScore(dayMetrics, dayHabits, goals, {}).score,
      });
    }
    
    return data;
  }, [metrics, habits, range]);
  
  // Calculate averages
  const averages = useMemo(() => {
    const logged = chartData.filter(d => d.steps || d.water || d.sleep);
    if (logged.length === 0) return { steps: 0, water: 0, sleep: 0, pages: 0 };
    
    return {
      steps: Math.round(logged.reduce((sum, d) => sum + d.steps, 0) / logged.length),
      water: (logged.reduce((sum, d) => sum + d.water, 0) / logged.length).toFixed(1),
      sleep: (logged.reduce((sum, d) => sum + d.sleep, 0) / logged.length).toFixed(1),
      pages: Math.round(logged.reduce((sum, d) => sum + d.pages, 0) / logged.length),
    };
  }, [chartData]);
  
  // Calculate score stats
  const scoreStats = useMemo(() => {
    const scores = chartData.filter(d => d.score > 0);
    if (scores.length === 0) return { avg: 0, best: 0, bestDate: null };
    
    const avg = Math.round(scores.reduce((sum, d) => sum + d.score, 0) / scores.length);
    const best = Math.max(...scores.map(d => d.score));
    const bestDay = scores.find(d => d.score === best);
    
    return { avg, best, bestDate: bestDay?.date };
  }, [chartData]);
  
  // Calculate push-up stats
  const pushupStats = useMemo(() => {
    // Period total (week/month/quarter)
    const periodTotal = chartData.reduce((sum, d) => sum + d.pushups, 0);
    
    // Year to date calculations
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const today = getToday();
    
    let ytdTotal = 0;
    let ytdDaysWithData = 0;
    
    // Calculate days in year so far
    const startOfYear = new Date(currentYear, 0, 1);
    const now = new Date();
    const daysInYearSoFar = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    
    // Sum all push-ups for current year
    Object.keys(metrics).forEach(date => {
      if (date >= yearStart && date <= today && metrics[date]?.pushups) {
        ytdTotal += metrics[date].pushups;
        ytdDaysWithData++;
      }
    });
    
    const ytdAvgPerDay = daysInYearSoFar > 0 ? (ytdTotal / daysInYearSoFar).toFixed(1) : 0;
    
    return {
      periodTotal,
      ytdTotal,
      ytdAvgPerDay,
      daysInYearSoFar
    };
  }, [chartData, metrics]);
  
  // Calculate streaks
  const noFapStreak = calculateStreak(habits, 'nofap');
  const bestNoFapStreak = useMemo(() => {
    let best = 0;
    let current = 0;
    const dates = Object.keys(habits).sort();
    
    dates.forEach(date => {
      if (habits[date]?.nofap) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    });
    
    return best;
  }, [habits]);
  
  // Habit percentages
  const habitStats = useMemo(() => {
    const days = rangeConfig[range].days;
    let workoutDays = 0;
    let runDays = 0;
    let keptWordDays = 0;
    let hardThingDays = 0;
    let loggedDays = 0;
    
    for (let i = 0; i < days; i++) {
      const date = getDaysAgo(i);
      const dayHabits = habits[date];
      if (dayHabits) {
        loggedDays++;
        if (dayHabits.workout) workoutDays++;
        if (dayHabits.run) runDays++;
        if (dayHabits.keptWord) keptWordDays++;
        if (dayHabits.hardThing) hardThingDays++;
      }
    }
    
    const pct = (n) => loggedDays ? Math.round((n / loggedDays) * 100) : 0;
    
    return {
      workout: pct(workoutDays),
      run: pct(runDays),
      keptWord: pct(keptWordDays),
      hardThing: pct(hardThingDays),
      loggedDays
    };
  }, [habits, range]);
  
  // Money stats
  const moneyStats = useMemo(() => {
    const days = rangeConfig[range].days;
    const startDate = getDaysAgo(days - 1);
    
    const periodTransactions = transactions.filter(t => t.date >= startDate);
    const income = periodTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = periodTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expenses, net: income - expenses };
  }, [transactions, range]);
  
  return (
    <div className="space-y-6 pb-24">
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-slate-400 text-sm">Track your progress</p>
      </div>
      
      {/* Range Selector */}
      <TabBar 
        tabs={[
          { id: 'week', label: 'Week' },
          { id: 'month', label: 'Month' },
          { id: 'quarter', label: '90 Days' }
        ]}
        active={range}
        onChange={setRange}
      />
      
      {/* Streak Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <div className="text-slate-400 text-sm">NoFap Streak</div>
          <div className="text-3xl font-bold text-amber-400">{noFapStreak}</div>
          <div className="text-slate-500 text-xs">Best: {bestNoFapStreak}</div>
        </Card>
        <Card className="p-4">
          <div className="text-slate-400 text-sm">Logged Days</div>
          <div className="text-3xl font-bold text-white">{habitStats.loggedDays}</div>
          <div className="text-slate-500 text-xs">of {rangeConfig[range].days}</div>
        </Card>
      </div>
      
      {/* Daily Score Trend */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-slate-400 text-sm">Daily Score</div>
            <div className="text-2xl font-bold text-white">{scoreStats.avg}</div>
            <div className="text-slate-500 text-xs">average</div>
          </div>
          <div className="text-right">
            <div className="text-amber-400 text-sm">Best: {scoreStats.best}</div>
            {scoreStats.bestDate && (
              <div className="text-slate-500 text-xs">
                {new Date(scoreStats.bestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(value) => [`${value} pts`, 'Score']}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#f59e0b" 
                fill="url(#scoreAreaGradient)" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 0, r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      {/* Steps Chart */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-slate-400 text-sm">Steps</div>
            <div className="text-2xl font-bold text-white">{averages.steps.toLocaleString()}</div>
            <div className="text-slate-500 text-xs">daily average</div>
          </div>
          <div className="text-right">
            <div className="text-emerald-400 text-sm">Goal: {(goals?.steps || 10000).toLocaleString()}</div>
          </div>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="steps" stroke="#f59e0b" fill="url(#stepsGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      {/* Sleep & Water */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Icons.Moon /> Sleep
          </div>
          <div className="text-2xl font-bold text-white">{averages.sleep}h</div>
          <div className="text-slate-500 text-xs">avg</div>
          <div className="h-16 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.slice(-7)}>
                <Line type="monotone" dataKey="sleep" stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Icons.Droplet /> Water
          </div>
          <div className="text-2xl font-bold text-white">{averages.water}L</div>
          <div className="text-slate-500 text-xs">avg</div>
          <div className="h-16 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.slice(-7)}>
                <Line type="monotone" dataKey="water" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      {/* Push-ups Stats */}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-slate-400 mb-3">
          <Icons.Dumbbell /> Push-ups
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-3xl font-bold text-white">{pushupStats.periodTotal.toLocaleString()}</div>
            <div className="text-slate-500 text-xs">{rangeConfig[range].label}</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-amber-400">{pushupStats.ytdTotal.toLocaleString()}</div>
            <div className="text-slate-500 text-xs">Year to Date</div>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Daily avg (YTD)</span>
            <span className="text-white font-semibold">{pushupStats.ytdAvgPerDay} / day</span>
          </div>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.slice(-14)}>
              <XAxis dataKey="label" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} interval={1} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="pushups" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      {/* Habit Stats */}
      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-4">Discipline Consistency</h3>
        <div className="space-y-3">
          {[
            { key: 'workout', label: 'Workout', value: habitStats.workout },
            { key: 'run', label: 'Run', value: habitStats.run },
            { key: 'keptWord', label: 'Kept Word', value: habitStats.keptWord },
            { key: 'hardThing', label: 'Hard Thing', value: habitStats.hardThing },
          ].map(({ key, label, value }) => (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{label}</span>
                <span className="text-slate-400">{value}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Money Summary */}
      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-4">Money ({rangeConfig[range].label})</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-emerald-400 text-xl font-bold">${moneyStats.income.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">Income</div>
          </div>
          <div>
            <div className="text-red-400 text-xl font-bold">${moneyStats.expenses.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">Expenses</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${moneyStats.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${Math.abs(moneyStats.net).toFixed(0)}
            </div>
            <div className="text-slate-500 text-xs">Net</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const ReviewPage = ({ metrics, habits, transactions, journals, goals }) => {
  const [reviewType, setReviewType] = useState('weekly');
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const today = getToday();
  const weekStart = getWeekStart(today);
  const monthStart = getMonthStart(today);
  
  const getReviewStats = (startDate, endDate) => {
    let sleepTotal = 0, sleepCount = 0;
    let stepsTotal = 0, stepsCount = 0;
    let waterTotal = 0, waterCount = 0;
    let pagesTotal = 0;
    let pushupsTotal = 0;
    let workoutDays = 0, runDays = 0;
    let income = 0, expenses = 0;
    let loggedDays = 0;
    let scoreTotal = 0, scoreCount = 0;
    
    let date = new Date(startDate);
    const end = new Date(endDate);
    
    while (date <= end) {
      const dateStr = formatDate(date);
      const dayMetrics = metrics[dateStr];
      const dayHabits = habits[dateStr];
      const dayJournal = journals[dateStr];
      
      if (dayMetrics || dayHabits) {
        loggedDays++;
        const score = calculateDailyScore(dayMetrics || {}, dayHabits || {}, goals, dayJournal || {});
        scoreTotal += score.score;
        scoreCount++;
      }
      
      if (dayMetrics?.sleep) { sleepTotal += dayMetrics.sleep; sleepCount++; }
      if (dayMetrics?.steps) { stepsTotal += dayMetrics.steps; stepsCount++; }
      if (dayMetrics?.water) { waterTotal += dayMetrics.water; waterCount++; }
      if (dayMetrics?.pages) pagesTotal += dayMetrics.pages;
      if (dayMetrics?.pushups) pushupsTotal += dayMetrics.pushups;
      
      if (dayHabits?.workout) workoutDays++;
      if (dayHabits?.run) runDays++;
      
      date.setDate(date.getDate() + 1);
    }
    
    transactions.forEach(t => {
      if (t.date >= startDate && t.date <= endDate) {
        if (t.type === 'income') income += t.amount;
        else expenses += t.amount;
      }
    });
    
    return {
      avgSleep: sleepCount ? (sleepTotal / sleepCount).toFixed(1) : '—',
      avgSteps: stepsCount ? Math.round(stepsTotal / stepsCount) : '—',
      avgWater: waterCount ? (waterTotal / waterCount).toFixed(1) : '—',
      totalPages: pagesTotal,
      totalPushups: pushupsTotal,
      avgScore: scoreCount ? Math.round(scoreTotal / scoreCount) : 0,
      workoutDays,
      runDays,
      income,
      expenses,
      net: income - expenses,
      loggedDays
    };
  };
  
  const weeklyStats = getReviewStats(weekStart, today);
  const monthlyStats = getReviewStats(monthStart, today);
  
  const stats = reviewType === 'weekly' ? weeklyStats : monthlyStats;
  const period = reviewType === 'weekly' ? 'This Week' : 'This Month';
  
  return (
    <div className="space-y-6 pb-24">
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold text-white mb-1">Review</h1>
        <p className="text-slate-400 text-sm">Reflect and improve</p>
      </div>
      
      <TabBar 
        tabs={[
          { id: 'weekly', label: 'Weekly' },
          { id: 'monthly', label: 'Monthly' }
        ]}
        active={reviewType}
        onChange={setReviewType}
      />
      
      {/* Average Score Highlight */}
      {stats.avgScore > 0 && (
        <Card className={`p-4 ${
          stats.avgScore >= 70 ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20' :
          stats.avgScore >= 50 ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20' :
          'bg-slate-800/50'
        }`}>
          <div className="text-center">
            <div className="text-slate-400 text-sm mb-1">Average Daily Score</div>
            <div className={`text-4xl font-bold ${
              stats.avgScore >= 70 ? 'text-emerald-400' :
              stats.avgScore >= 50 ? 'text-amber-400' :
              'text-slate-400'
            }`}>{stats.avgScore}</div>
            <div className="text-slate-500 text-sm mt-1">
              {stats.avgScore >= 70 ? '🔥 Great performance!' :
               stats.avgScore >= 50 ? '💪 Solid effort!' :
               '📈 Room to grow'}
            </div>
          </div>
        </Card>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="text-slate-400 text-sm">Avg Sleep</div>
          <div className="text-2xl font-bold text-white">{stats.avgSleep}h</div>
        </Card>
        <Card className="p-4">
          <div className="text-slate-400 text-sm">Avg Steps</div>
          <div className="text-2xl font-bold text-white">{typeof stats.avgSteps === 'number' ? stats.avgSteps.toLocaleString() : stats.avgSteps}</div>
        </Card>
        <Card className="p-4">
          <div className="text-slate-400 text-sm">Avg Water</div>
          <div className="text-2xl font-bold text-white">{stats.avgWater}L</div>
        </Card>
        <Card className="p-4">
          <div className="text-slate-400 text-sm">Pages Read</div>
          <div className="text-2xl font-bold text-white">{stats.totalPages}</div>
        </Card>
        <Card className="p-4">
          <div className="text-slate-400 text-sm">Push-ups</div>
          <div className="text-2xl font-bold text-amber-400">{stats.totalPushups.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-slate-400 text-sm">Workout Days</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.workoutDays}</div>
        </Card>
        <Card className="p-4">
          <div className="text-slate-400 text-sm">Run Days</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.runDays}</div>
        </Card>
      </div>
      
      {/* Money Summary */}
      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-3">Money Summary</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-emerald-400 text-xl font-bold">${stats.income.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">Income</div>
          </div>
          <div>
            <div className="text-red-400 text-xl font-bold">${stats.expenses.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">Spent</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${stats.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${Math.abs(stats.net).toFixed(0)}
            </div>
            <div className="text-slate-500 text-xs">Net</div>
          </div>
        </div>
      </Card>
      
      {/* Consistency */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-sm">Consistency</div>
            <div className="text-3xl font-bold text-white">{Math.round((stats.loggedDays / (reviewType === 'weekly' ? 7 : 30)) * 100)}%</div>
          </div>
          <div className="text-right text-slate-500 text-sm">
            {stats.loggedDays} days logged
          </div>
        </div>
      </Card>
      
      {/* Review Prompts */}
      <Card className="p-4 bg-slate-800/30">
        <h3 className="font-semibold text-white mb-4">Reflection Prompts</h3>
        <div className="space-y-4">
          <div>
            <div className="text-amber-400 text-sm mb-1">Biggest win this {reviewType === 'weekly' ? 'week' : 'month'}?</div>
            <div className="text-slate-400 text-sm">What went well? What are you proud of?</div>
          </div>
          <div>
            <div className="text-amber-400 text-sm mb-1">Biggest lesson or failure?</div>
            <div className="text-slate-400 text-sm">What would you do differently?</div>
          </div>
          <div>
            <div className="text-amber-400 text-sm mb-1">One standard to raise?</div>
            <div className="text-slate-400 text-sm">What will you commit to next {reviewType === 'weekly' ? 'week' : 'month'}?</div>
          </div>
          {reviewType === 'monthly' && (
            <div className="pt-4 border-t border-slate-700">
              <div className="text-violet-400 text-sm mb-1">If this month repeats for a year...</div>
              <div className="text-slate-400 text-sm">Who do you become? Is that who you want to be?</div>
            </div>
          )}
        </div>
      </Card>
      
      <Button className="w-full" onClick={() => setShowReviewForm(true)}>
        Write {reviewType === 'weekly' ? 'Weekly' : 'Monthly'} Review
      </Button>
      
      <Modal 
        isOpen={showReviewForm} 
        onClose={() => setShowReviewForm(false)}
        title={`${reviewType === 'weekly' ? 'Weekly' : 'Monthly'} Review`}
      >
        <ReviewForm 
          type={reviewType}
          onSave={() => setShowReviewForm(false)}
        />
      </Modal>
    </div>
  );
};

const ReviewForm = ({ type, onSave }) => {
  const [win, setWin] = useState('');
  const [lesson, setLesson] = useState('');
  const [standard, setStandard] = useState('');
  const [yearReflection, setYearReflection] = useState('');
  
  return (
    <div className="space-y-4">
      <div>
        <label className="text-amber-400 text-sm mb-2 block">Biggest win?</label>
        <textarea
          value={win}
          onChange={(e) => setWin(e.target.value)}
          placeholder="What went well?"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
          rows={3}
        />
      </div>
      <div>
        <label className="text-amber-400 text-sm mb-2 block">Biggest lesson or failure?</label>
        <textarea
          value={lesson}
          onChange={(e) => setLesson(e.target.value)}
          placeholder="What would you do differently?"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
          rows={3}
        />
      </div>
      <div>
        <label className="text-amber-400 text-sm mb-2 block">One standard to raise?</label>
        <textarea
          value={standard}
          onChange={(e) => setStandard(e.target.value)}
          placeholder="What will you commit to?"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
          rows={3}
        />
      </div>
      {type === 'monthly' && (
        <div>
          <label className="text-violet-400 text-sm mb-2 block">If this month repeats for a year, who do you become?</label>
          <textarea
            value={yearReflection}
            onChange={(e) => setYearReflection(e.target.value)}
            placeholder="Reflect on your trajectory..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
            rows={4}
          />
        </div>
      )}
      <Button className="w-full" onClick={onSave}>
        Save Review
      </Button>
    </div>
  );
};

const SettingsPage = ({ goals, setGoals, metrics, habits, journals, transactions, library, learningNotes }) => {
  const [localGoals, setLocalGoals] = useState(goals);
  
  const handleExport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      metrics,
      habits,
      journals,
      transactions,
      library,
      learningNotes,
      goals
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progress-export-${getToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.metrics) saveData(STORAGE_KEYS.metrics, data.metrics);
        if (data.habits) saveData(STORAGE_KEYS.habits, data.habits);
        if (data.journals) saveData(STORAGE_KEYS.journals, data.journals);
        if (data.transactions) saveData(STORAGE_KEYS.transactions, data.transactions);
        if (data.library) saveData(STORAGE_KEYS.library, data.library);
        if (data.learningNotes) saveData(STORAGE_KEYS.learningNotes, data.learningNotes);
        if (data.goals) saveData(STORAGE_KEYS.goals, data.goals);
        window.location.reload();
      } catch (err) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };
  
  const saveGoals = () => {
    setGoals(localGoals);
  };
  
  return (
    <div className="space-y-6 pb-24">
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-slate-400 text-sm">Configure your goals</p>
      </div>
      
      {/* Goals */}
      <Card className="p-4">
        <h3 className="font-semibold text-white mb-4">Daily Goals</h3>
        <p className="text-slate-400 text-sm mb-4">These goals affect your daily score calculation</p>
        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Steps Goal</label>
            <input
              type="number"
              value={localGoals?.steps || 10000}
              onChange={(e) => setLocalGoals(prev => ({ ...prev, steps: Number(e.target.value) }))}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Water Goal (L)</label>
            <input
              type="number"
              step="0.1"
              value={localGoals?.water || 1.5}
              onChange={(e) => setLocalGoals(prev => ({ ...prev, water: Number(e.target.value) }))}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Sleep Goal (hours)</label>
            <input
              type="number"
              step="0.5"
              value={localGoals?.sleep || 7.5}
              onChange={(e) => setLocalGoals(prev => ({ ...prev, sleep: Number(e.target.value) }))}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Pages Goal (daily)</label>
            <input
              type="number"
              value={localGoals?.pages || 20}
              onChange={(e) => setLocalGoals(prev => ({ ...prev, pages: Number(e.target.value) }))}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Push-ups Goal (daily)</label>
            <input
              type="number"
              value={localGoals?.pushups || 50}
              onChange={(e) => setLocalGoals(prev => ({ ...prev, pushups: Number(e.target.value) }))}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <Button className="w-full" onClick={saveGoals}>
            Save Goals
          </Button>
        </div>
      </Card>
      
      {/* Data Management */}
      <Card className="p-4">
        <h3 className="font-semibold text-white mb-4">Data Management</h3>
        <div className="space-y-3">
          <Button variant="secondary" className="w-full" onClick={handleExport}>
            Export All Data (JSON)
          </Button>
          <label className="block">
            <Button variant="secondary" className="w-full pointer-events-none">
              Import Data
            </Button>
            <input 
              type="file" 
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </Card>
      
      {/* Stats */}
      <Card className="p-4 bg-slate-800/30">
        <h3 className="text-slate-400 text-sm mb-3">Data Stats</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Days Logged:</span>
            <span className="text-white ml-2">{Object.keys(metrics).length}</span>
          </div>
          <div>
            <span className="text-slate-500">Journal Entries:</span>
            <span className="text-white ml-2">{Object.values(journals).filter(j => j?.text).length}</span>
          </div>
          <div>
            <span className="text-slate-500">Transactions:</span>
            <span className="text-white ml-2">{transactions.length}</span>
          </div>
          <div>
            <span className="text-slate-500">Library Items:</span>
            <span className="text-white ml-2">{library.length}</span>
          </div>
          <div>
            <span className="text-slate-500">Learning Notes:</span>
            <span className="text-white ml-2">{learningNotes.length}</span>
          </div>
        </div>
      </Card>
      
      <div className="text-center text-slate-600 text-sm pt-4">
        Personal Progress Tracker v1.0
      </div>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================

export default function App() {
  const [page, setPage] = useState('today');
  
  // Listen for navigation events from child components
  useEffect(() => {
    const handleNavigate = (e) => setPage(e.detail);
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);
  
  // Persisted state
  const [metrics, setMetrics] = usePersistedState(STORAGE_KEYS.metrics, {});
  const [habits, setHabits] = usePersistedState(STORAGE_KEYS.habits, {});
  const [journals, setJournals] = usePersistedState(STORAGE_KEYS.journals, {});
  const [transactions, setTransactions] = usePersistedState(STORAGE_KEYS.transactions, []);
  const [library, setLibrary] = usePersistedState(STORAGE_KEYS.library, []);
  const [readingSessions, setReadingSessions] = usePersistedState(STORAGE_KEYS.readingSessions, []);
  const [learningNotes, setLearningNotes] = usePersistedState(STORAGE_KEYS.learningNotes, []);
  const [srsState, setSrsState] = usePersistedState(STORAGE_KEYS.srsState, {});
  const [goals, setGoals] = usePersistedState(STORAGE_KEYS.goals, { steps: 10000, water: 1.5, sleep: 7.5, pages: 20, pushups: 50 });
  
  const navItems = [
    { id: 'today', icon: <Icons.Home />, label: 'Today' },
    { id: 'log', icon: <Icons.Calendar />, label: 'Log' },
    { id: 'money', icon: <Icons.DollarSign />, label: 'Money' },
    { id: 'library', icon: <Icons.Book />, label: 'Library' },
    { id: 'learning', icon: <Icons.Brain />, label: 'Learn' },
    { id: 'journal', icon: <Icons.Edit />, label: 'Journal' },
    { id: 'analytics', icon: <Icons.Chart />, label: 'Stats' },
    { id: 'review', icon: <Icons.Trophy />, label: 'Review' },
    { id: 'settings', icon: <Icons.Settings />, label: 'Settings' },
  ];
  
  const renderPage = () => {
    const props = { 
      metrics, setMetrics, 
      habits, setHabits, 
      journals, setJournals,
      transactions, setTransactions,
      library, setLibrary,
      readingSessions, setReadingSessions,
      learningNotes, setLearningNotes,
      srsState, setSrsState,
      goals, setGoals
    };
    
    switch (page) {
      case 'today': return <TodayPage {...props} />;
      case 'log': return <LogPage metrics={metrics} habits={habits} journals={journals} setJournals={setJournals} goals={goals} />;
      case 'money': return <MoneyPage {...props} />;
      case 'journal': return <JournalPage {...props} />;
      case 'library': return <LibraryPage {...props} />;
      case 'learning': return <LearningPage {...props} />;
      case 'analytics': return <AnalyticsPage {...props} />;
      case 'review': return <ReviewPage metrics={metrics} habits={habits} transactions={transactions} journals={journals} goals={goals} />;
      case 'settings': return <SettingsPage {...props} />;
      default: return <TodayPage {...props} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Main Content */}
      <main className="relative max-w-lg mx-auto px-4 py-6">
        {renderPage()}
      </main>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 safe-area-pb">
        <div className="max-w-lg mx-auto px-2">
          <div className="flex justify-around py-2">
            {navItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all ${
                  page === item.id 
                    ? 'text-amber-400' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => setPage(prevPage => 
                ['journal', 'analytics', 'review', 'settings'].includes(prevPage) ? prevPage : 'analytics'
              )}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all ${
                ['journal', 'analytics', 'review', 'settings'].includes(page)
                  ? 'text-amber-400' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icons.Chart />
              <span className="text-xs mt-1">More</span>
            </button>
          </div>
        </div>
      </nav>
      
      {/* Extra Navigation Modal for More */}
      {['journal', 'analytics', 'review', 'settings'].includes(page) && (
        <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto bg-slate-800 rounded-2xl border border-slate-700 p-2 shadow-2xl z-40">
          <div className="grid grid-cols-4 gap-2">
            {navItems.slice(5).map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex flex-col items-center py-3 px-4 rounded-xl transition-all ${
                  page === item.id 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'text-slate-400 hover:bg-slate-700'
                }`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
