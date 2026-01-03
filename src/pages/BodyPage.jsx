import { useMemo, useState } from 'react';

import { Button, Card, HabitToggle, MetricInput } from '../components';
import { getDaysAgo, getToday } from '../utils';

const BodyPage = ({ metrics, setMetrics, habits, setHabits, goals }) => {
  const today = getToday();
  const todayMetrics = metrics[today] || {};
  const todayHabits = habits[today] || {};
  const [historyDate, setHistoryDate] = useState(today);

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

  const weekStats = useMemo(() => {
    let stepsTotal = 0;
    let stepsCount = 0;
    let sleepTotal = 0;
    let sleepCount = 0;
    let waterDays = 0;
    let pushupsTotal = 0;
    let squatsTotal = 0;
    let workoutDays = 0;
    let runDays = 0;
    let runDistanceTotal = 0;

    for (let i = 0; i < 7; i++) {
      const date = getDaysAgo(i);
      const dayMetrics = metrics[date] || {};
      const dayHabits = habits[date] || {};

      if (dayMetrics.steps) {
        stepsTotal += dayMetrics.steps;
        stepsCount++;
      }
      if (dayMetrics.sleep) {
        sleepTotal += dayMetrics.sleep;
        sleepCount++;
      }
      if (dayMetrics.water) {
        waterDays++;
      }
      if (dayMetrics.pushups) {
        pushupsTotal += dayMetrics.pushups;
      }
      if (dayMetrics.squats) {
        squatsTotal += dayMetrics.squats;
      }
      if (dayHabits.workout) workoutDays++;
      if (dayHabits.run) runDays++;
      if (dayMetrics.runDistance) runDistanceTotal += dayMetrics.runDistance;
    }

    return {
      avgSteps: stepsCount ? Math.round(stepsTotal / stepsCount) : null,
      avgSleep: sleepCount ? (sleepTotal / sleepCount).toFixed(1) : null,
      waterPct: Math.round((waterDays / 7) * 100),
      pushupsTotal,
      squatsTotal,
      workoutDays,
      runDays,
      runDistanceTotal
    };
  }, [metrics, habits]);

  const historyDates = useMemo(() => {
    const year = new Date().getFullYear();
    return Array.from({ length: 14 }, (_, i) => getDaysAgo(i))
      .filter((date) => new Date(date).getFullYear() === year);
  }, []);
  const historyMetrics = metrics[historyDate] || {};
  const historyHabits = habits[historyDate] || {};

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-start justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Body</h1>
          <p className="text-slate-400 text-sm">Steps, sleep, water, training</p>
        </div>
        <Button
          variant="ghost"
          className="border border-slate-800"
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'log' }))}
        >
          Edit Past Days
        </Button>
      </div>

      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Today</h3>
        <div className="grid gap-3">
          <MetricInput
            label="Steps"
            value={todayMetrics.steps}
            onChange={(v) => updateMetric('steps', v)}
            placeholder="0"
            goal={goals?.steps || 10000}
          />
          <HabitToggle
            label={`Water goal met (${goals?.water || 1.5}L)`}
            value={Boolean(todayMetrics.water)}
            onChange={(v) => updateMetric('water', v ? (goals?.water || 1.5) : null)}
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
            label="Push-ups"
            value={todayMetrics.pushups}
            onChange={(v) => updateMetric('pushups', v)}
            placeholder="0"
            goal={goals?.pushups || 50}
            quickAdd={[10, 20, 50]}
          />
          <MetricInput
            label="Squats"
            value={todayMetrics.squats}
            onChange={(v) => updateMetric('squats', v)}
            placeholder="0"
            goal={goals?.squats || 50}
            quickAdd={[10, 20, 50]}
          />
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Training</h3>
        <div className="space-y-2">
          <HabitToggle
            label="Workout"
            value={todayHabits.workout}
            onChange={(v) => updateHabit('workout', v)}
          />
          <HabitToggle
            label="Run"
            value={todayHabits.run}
            onChange={(v) => updateHabit('run', v)}
          />
          {todayHabits.run && (
            <MetricInput
              label="Run Distance"
              value={todayMetrics.runDistance}
              onChange={(v) => updateMetric('runDistance', v)}
              placeholder="0"
              unit="km"
            />
          )}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-3">7-day Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-white">
              {weekStats.avgSteps ? weekStats.avgSteps.toLocaleString() : 'n/a'}
            </div>
            <div className="text-slate-500 text-xs">Avg Steps</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {weekStats.avgSleep || 'n/a'}h
            </div>
            <div className="text-slate-500 text-xs">Avg Sleep</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sky-400">{weekStats.waterPct}%</div>
            <div className="text-slate-500 text-xs">Water Goal</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">{weekStats.pushupsTotal}</div>
            <div className="text-slate-500 text-xs">Push-ups</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-400">{weekStats.squatsTotal}</div>
            <div className="text-slate-500 text-xs">Squats</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{weekStats.workoutDays}</div>
            <div className="text-slate-500 text-xs">Workout Days</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sky-400">
              {weekStats.runDistanceTotal.toFixed(1)} km
            </div>
            <div className="text-slate-500 text-xs">Run Distance</div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-3">History</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {historyDates.map((date) => {
            const d = new Date(date);
            const isSelected = date === historyDate;
            return (
              <button
                key={date}
                onClick={() => setHistoryDate(date)}
                className={`flex-shrink-0 w-12 py-2 rounded-xl text-center text-xs ${
                  isSelected ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <div className="opacity-70">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="text-sm font-semibold">{d.getDate()}</div>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm mt-3">
          <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2">
            <span className="text-slate-300">Steps</span>
            <span className="text-white">{historyMetrics.steps ?? 'n/a'}</span>
          </div>
          <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2">
            <span className="text-slate-300">Sleep</span>
            <span className="text-white">{historyMetrics.sleep ?? 'n/a'}</span>
          </div>
          <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2">
            <span className="text-slate-300">Water Goal</span>
            <span className={historyMetrics.water ? 'text-emerald-400' : 'text-slate-600'}>
              {historyMetrics.water ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2">
            <span className="text-slate-300">Push-ups</span>
            <span className="text-white">{historyMetrics.pushups ?? 'n/a'}</span>
          </div>
          <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2">
            <span className="text-slate-300">Squats</span>
            <span className="text-white">{historyMetrics.squats ?? 'n/a'}</span>
          </div>
          <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2">
            <span className="text-slate-300">Workout</span>
            <span className={historyHabits.workout ? 'text-emerald-400' : 'text-slate-600'}>
              {historyHabits.workout ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2">
            <span className="text-slate-300">Run</span>
            <span className={historyHabits.run ? 'text-emerald-400' : 'text-slate-600'}>
              {historyHabits.run
                ? historyMetrics.runDistance
                  ? `${historyMetrics.runDistance} km`
                  : 'Yes'
                : 'No'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BodyPage;
