import { useState } from 'react';

import { Button, Card } from '../components';
import { getToday } from '../utils';

const SettingsPage = ({
  goals,
  setGoals,
  metrics,
  habits,
  journals,
  transactions,
  library,
  readingSessions,
  setReadingSessions,
  learningNotes,
  setLearningNotes,
  srsState,
  setSrsState,
  reviews,
  setReviews,
  mediaSessions,
  setMediaSessions,
  focusHabit,
  setFocusHabit,
  setMetrics,
  setHabits,
  setJournals,
  setTransactions,
  setLibrary,
  setOnboardingComplete,
  setFocusAlertLast,
  onSignOut
}) => {
  const [localGoals, setLocalGoals] = useState(goals);
  const habitOptions = [
    { value: 'nofap', label: 'NoFap' },
    { value: 'workout', label: 'Workout' },
    { value: 'run', label: 'Run' },
    { value: 'keptWord', label: 'Kept my word' },
    { value: 'hardThing', label: 'Did a hard thing' },
    { value: 'healthyEating', label: 'Ate healthy (no sugar)' }
  ];

  const handleExport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      metrics,
      habits,
      journals,
      transactions,
      library,
      readingSessions,
      learningNotes,
      srsState,
      reviews,
      mediaSessions,
      goals,
      focusHabit,
      focusAlertLast: '',
      onboardingComplete: true
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
        if (data.metrics) setMetrics(data.metrics);
        if (data.habits) setHabits(data.habits);
        if (data.journals) {
          const normalizedJournals = Object.fromEntries(
            Object.entries(data.journals).map(([date, entry]) => {
              if (!entry) return [date, entry];
              const important = entry.important || entry.avoided || '';
              return [date, { ...entry, important, avoided: undefined }];
            })
          );
          setJournals(normalizedJournals);
        }
        if (data.transactions) setTransactions(data.transactions);
        if (data.library) setLibrary(data.library);
        if (data.readingSessions) setReadingSessions(data.readingSessions);
        if (data.learningNotes) setLearningNotes(data.learningNotes);
        if (data.srsState) setSrsState(data.srsState);
        if (data.reviews) setReviews(data.reviews);
        if (data.goals) setGoals(data.goals);
        if (data.mediaSessions) setMediaSessions(data.mediaSessions);
        if (data.focusHabit) setFocusHabit(data.focusHabit);
        if (data.focusAlertLast) setFocusAlertLast(data.focusAlertLast);
        setOnboardingComplete(true);
      } catch {
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

      <Card className="p-4">
        <h3 className="font-semibold text-white mb-4">Weekly Focus</h3>
        <p className="text-slate-400 text-sm mb-4">Highlight one habit to prioritize this week</p>
        <select
          value={focusHabit || ''}
          onChange={(e) => setFocusHabit(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
        >
          {habitOptions.map((habit) => (
            <option key={habit.value} value={habit.value}>
              {habit.label}
            </option>
          ))}
        </select>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-white mb-4">Data Management</h3>
        <div className="space-y-3">
          <Button variant="secondary" className="w-full" onClick={handleExport}>
            Export All Data (JSON)
          </Button>
          <label className="relative block">
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
          <div>
            <span className="text-slate-500">Media Sessions:</span>
            <span className="text-white ml-2">{mediaSessions.length}</span>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-white mb-4">Account</h3>
        <Button variant="secondary" className="w-full" onClick={onSignOut}>
          Sign Out
        </Button>
      </Card>

      <div className="text-center text-slate-600 text-sm pt-4">
        Personal Progress Tracker v1.0
      </div>
    </div>
  );
};

export default SettingsPage;
