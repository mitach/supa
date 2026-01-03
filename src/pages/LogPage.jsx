import { useEffect, useMemo, useState } from 'react';

import { Button, Card, HabitToggle, Icons, MetricInput } from '../components';
import { calculateDailyScore, getDaysAgo, getToday } from '../utils';

const LogPage = ({ metrics, setMetrics, habits, setHabits, journals, setJournals, readingSessions, goals }) => {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [editMode, setEditMode] = useState(false);
  const [pagesView, setPagesView] = useState('total');
  const dayMetrics = metrics[selectedDate] || {};
  const dayHabits = habits[selectedDate] || {};
  const dayJournal = journals[selectedDate] || {};
  const daySessionPages = readingSessions
    .filter(s => s.date === selectedDate)
    .reduce((sum, s) => sum + s.pages, 0);
  const dayPagesTotal = (dayMetrics.pages || 0) + daySessionPages;
  const [editMetrics, setEditMetrics] = useState(dayMetrics);
  const [editHabits, setEditHabits] = useState(dayHabits);
  const [editJournal, setEditJournal] = useState({
    text: dayJournal.text || '',
    til: dayJournal.til || '',
    important: dayJournal.important || dayJournal.avoided || ''
  });

  useEffect(() => {
    setEditMode(false);
    setPagesView('total');
    setEditMetrics(dayMetrics);
    setEditHabits(dayHabits);
    setEditJournal({
      text: dayJournal.text || '',
      til: dayJournal.til || '',
      important: dayJournal.important || dayJournal.avoided || ''
    });
  }, [selectedDate, metrics, habits, journals]);

  const dayScore = useMemo(() => {
    return calculateDailyScore({ ...dayMetrics, pages: dayPagesTotal }, dayHabits, goals, dayJournal);
  }, [dayMetrics, dayHabits, goals, dayJournal, dayPagesTotal]);

  const dates = useMemo(() => {
    const result = [];
    const year = new Date().getFullYear();
    for (let i = 0; i < 30; i++) {
      const date = getDaysAgo(i);
      if (new Date(date).getFullYear() === year) {
        result.push(date);
      }
    }
    return result;
  }, []);

  const hasData = (date) => {
    const hasSessions = readingSessions.some(s => s.date === date);
    return metrics[date] || habits[date] || journals[date] || hasSessions;
  };

  const getDateScore = (date) => {
    const m = metrics[date] || {};
    const h = habits[date] || {};
    const j = journals[date] || {};
    const sessionPages = readingSessions
      .filter(s => s.date === date)
      .reduce((sum, s) => sum + s.pages, 0);
    const totalPages = (m.pages || 0) + sessionPages;
    if (!metrics[date] && !habits[date] && sessionPages === 0) return null;
    return calculateDailyScore({ ...m, pages: totalPages }, h, goals, j).score;
  };

  const saveEdits = () => {
    const cleanedMetrics = Object.fromEntries(
      Object.entries(editMetrics || {}).filter(([, value]) => value !== null && value !== '' && value !== undefined)
    );
    if (!editHabits?.run) {
      delete cleanedMetrics.runDistance;
    }
    const cleanedHabits = Object.fromEntries(
      Object.entries(editHabits || {}).filter(([, value]) => value === true)
    );
    const journalText = `${editJournal.text || ''}${editJournal.til || ''}${editJournal.important || ''}`;
    const hasJournal = journalText.trim().length > 0;
    const cleanedJournal = hasJournal
      ? { text: editJournal.text, til: editJournal.til, important: editJournal.important }
      : null;

    setMetrics(prev => {
      const next = { ...prev };
      if (Object.keys(cleanedMetrics).length > 0) {
        next[selectedDate] = cleanedMetrics;
      } else {
        delete next[selectedDate];
      }
      return next;
    });

    setHabits(prev => {
      const next = { ...prev };
      if (Object.keys(cleanedHabits).length > 0) {
        next[selectedDate] = cleanedHabits;
      } else {
        delete next[selectedDate];
      }
      return next;
    });

    setJournals(prev => {
      const next = { ...prev };
      if (cleanedJournal) {
        next[selectedDate] = cleanedJournal;
      } else {
        delete next[selectedDate];
      }
      return next;
    });

    setEditMode(false);
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
          <div className="flex items-center gap-2">
            {hasData(selectedDate) && (
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                dayScore.score >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
                dayScore.score >= 50 ? 'bg-amber-500/20 text-amber-400' :
                'bg-slate-700 text-slate-400'
              }`}>
                {dayScore.score} pts
              </div>
            )}
            <Button
              variant={editMode ? 'secondary' : 'ghost'}
              className="px-3 py-2"
              onClick={() => setEditMode(prev => !prev)}
            >
              {editMode ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </div>

        {!editMode && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { key: 'steps', label: 'Steps', icon: <Icons.Activity /> },
                { key: 'water', label: 'Water Goal', icon: <Icons.Droplet /> },
                { key: 'sleep', label: 'Sleep', unit: 'h', icon: <Icons.Moon /> },
                { key: 'pages', label: 'Pages', icon: <Icons.Book /> },
                { key: 'pushups', label: 'Push-ups', icon: <Icons.Dumbbell /> },
                { key: 'squats', label: 'Squats', icon: <Icons.Dumbbell /> },
              ].map(({ key, label, unit, icon }) => (
                <div key={key} className="bg-slate-900/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    {icon} {label}
                  </div>
                <div className="text-xl font-bold text-white">
                  {key === 'pages'
                    ? dayPagesTotal || 'n/a'
                    : key === 'water'
                      ? dayMetrics.water != null ? 'Yes' : 'n/a'
                      : dayMetrics[key] ?? 'n/a'}
                  {unit && dayMetrics[key] ? unit : ''}
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
                { key: 'healthyEating', label: 'Ate healthy (no sugar)' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <span className="text-slate-300">{label}</span>
                  <span className={dayHabits[key] ? 'text-emerald-400' : 'text-slate-600'}>
                    {dayHabits[key]
                      ? key === 'run' && dayMetrics.runDistance
                        ? `Yes (${dayMetrics.runDistance} km)`
                        : 'Yes'
                      : 'No'}
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
            {(dayJournal.important || dayJournal.avoided) && (
              <div className="bg-slate-900/50 rounded-xl p-4">
                <div className="text-slate-400 text-sm mb-2">Important</div>
                <p className="text-white">{dayJournal.important || dayJournal.avoided}</p>
              </div>
            )}

            {!hasData(selectedDate) && (
              <div className="text-center py-8 text-slate-500">
                No data logged for this day
              </div>
            )}
          </>
        )}

        {editMode && (
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Metrics</h4>
              <div className="grid gap-3">
                <MetricInput
                  label="Steps"
                  value={editMetrics.steps}
                  onChange={(v) => setEditMetrics(prev => ({ ...prev, steps: v }))}
                  placeholder="0"
                />
                <HabitToggle
                  label={`Water goal met (${goals?.water || 1.5}L)`}
                  value={Boolean(editMetrics.water)}
                  onChange={(v) => setEditMetrics(prev => ({
                    ...prev,
                    water: v ? (goals?.water || 1.5) : null
                  }))}
                />
                <MetricInput
                  label="Sleep"
                  value={editMetrics.sleep}
                  onChange={(v) => setEditMetrics(prev => ({ ...prev, sleep: v }))}
                  placeholder="0"
                  unit="hours"
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Pages Read</span>
                    <div className="flex gap-2">
                      {['total', 'manual', 'sessions'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setPagesView(mode)}
                          className={`px-2 py-1 rounded-lg capitalize ${
                            pagesView === mode
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800/60 text-slate-400'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <MetricInput
                    label="Pages Read"
                    value={
                      pagesView === 'manual'
                        ? editMetrics.pages || 0
                        : pagesView === 'sessions'
                          ? daySessionPages
                          : (editMetrics.pages || 0) + daySessionPages
                    }
                    onChange={(v) => {
                      if (pagesView === 'sessions') return;
                      if (v === null) {
                        setEditMetrics(prev => ({ ...prev, pages: null }));
                        return;
                      }
                      if (pagesView === 'manual') {
                        setEditMetrics(prev => ({ ...prev, pages: v === 0 ? null : v }));
                        return;
                      }
                      const manualPages = Math.max(0, v - daySessionPages);
                      setEditMetrics(prev => ({ ...prev, pages: manualPages === 0 ? null : manualPages }));
                    }}
                    placeholder="0"
                    disabled={pagesView === 'sessions'}
                  />
                </div>
                <div className="text-xs text-slate-500 -mt-2 px-1">
                  Sessions: {daySessionPages} pages • Manual: {editMetrics.pages || 0}
                </div>
                <MetricInput
                  label="Push-ups"
                  value={editMetrics.pushups}
                  onChange={(v) => setEditMetrics(prev => ({ ...prev, pushups: v }))}
                  placeholder="0"
                />
                <MetricInput
                  label="Squats"
                  value={editMetrics.squats}
                  onChange={(v) => setEditMetrics(prev => ({ ...prev, squats: v }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Discipline</h4>
              <div className="space-y-2">
                <HabitToggle
                  label="NoFap - Clean today"
                  value={editHabits.nofap}
                  onChange={(v) => setEditHabits(prev => ({ ...prev, nofap: v }))}
                />
                <HabitToggle
                  label="Workout"
                  value={editHabits.workout}
                  onChange={(v) => setEditHabits(prev => ({ ...prev, workout: v }))}
                />
                <HabitToggle
                  label="Run"
                  value={editHabits.run}
                  onChange={(v) => setEditHabits(prev => ({ ...prev, run: v }))}
                />
                {editHabits.run && (
                  <MetricInput
                    label="Run Distance"
                    value={editMetrics.runDistance}
                    onChange={(v) => setEditMetrics(prev => ({ ...prev, runDistance: v }))}
                    placeholder="0"
                    unit="km"
                  />
                )}
                <HabitToggle
                  label="Kept my word"
                  value={editHabits.keptWord}
                  onChange={(v) => setEditHabits(prev => ({ ...prev, keptWord: v }))}
                />
                <HabitToggle
                  label="Did a hard thing voluntarily"
                  value={editHabits.hardThing}
                  onChange={(v) => setEditHabits(prev => ({ ...prev, hardThing: v }))}
                />
                <HabitToggle
                  label="Ate healthy (no sugar)"
                  value={editHabits.healthyEating}
                  onChange={(v) => setEditHabits(prev => ({ ...prev, healthyEating: v }))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Journal</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Journal</label>
                  <textarea
                    value={editJournal.text}
                    onChange={(e) => setEditJournal(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Journal entry..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Today I Learned</label>
                  <textarea
                    value={editJournal.til}
                    onChange={(e) => setEditJournal(prev => ({ ...prev, til: e.target.value }))}
                    placeholder="What did you learn?"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Something important happened today</label>
                  <textarea
                    value={editJournal.important}
                    onChange={(e) => setEditJournal(prev => ({ ...prev, important: e.target.value }))}
                    placeholder="What happened?"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={saveEdits}>
              Save Changes
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LogPage;
