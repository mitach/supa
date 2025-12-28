import { useMemo, useState } from 'react';

import { Card, Icons } from '../components';
import { calculateDailyScore, getDaysAgo, getToday } from '../utils';

const LogPage = ({ metrics, habits, journals, setJournals, goals }) => {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const dayMetrics = metrics[selectedDate] || {};
  const dayHabits = habits[selectedDate] || {};
  const dayJournal = journals[selectedDate] || {};

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
                {dayMetrics[key] ?? 'n/a'}{unit && dayMetrics[key] ? unit : ''}
              </div>
            </div>
          ))}
        </div>

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
                {dayHabits[key] ? 'Yes' : 'No'}
              </span>
            </div>
          ))}
        </div>

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

export default LogPage;
