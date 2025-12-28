import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  Card,
  DailyScoreCard,
  HabitToggle,
  Icons,
  MetricInput,
  Modal,
  ReadingSessionForm,
  ScoreBreakdownModal,
  TransactionForm
} from '../components';
import { calculateDailyScore, calculateStreak, generateId, getDaysAgo, getToday } from '../utils';

const TodayPage = ({
  metrics, setMetrics,
  habits, setHabits,
  journals, setJournals,
  transactions, setTransactions,
  readingSessions, setReadingSessions,
  library,
  goals,
  focusHabit
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

  const todaySpend = transactions
    .filter(t => t.date === today && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const todayIncome = transactions
    .filter(t => t.date === today && t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayPages = readingSessions
    .filter(s => s.date === today)
    .reduce((sum, s) => sum + s.pages, 0);

  const dailyScore = useMemo(() => {
    const metricsWithPages = { ...todayMetrics, pages: todayPages || todayMetrics.pages };
    return calculateDailyScore(metricsWithPages, todayHabits, goals, todayJournal);
  }, [todayMetrics, todayHabits, goals, todayJournal, todayPages]);

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

  const generateSummary = () => {
    const parts = [];

    const bodyParts = [];
    if (todayMetrics.sleep) bodyParts.push(`${todayMetrics.sleep}h sleep`);
    if (todayMetrics.steps) bodyParts.push(`${todayMetrics.steps.toLocaleString()} steps`);
    if (todayMetrics.water) bodyParts.push(`${todayMetrics.water}L water`);
    if (bodyParts.length) parts.push(`Body: ${bodyParts.join(', ')}`);

    const mindParts = [];
    if (todayPages > 0) mindParts.push(`${todayPages} pages`);
    if (tilText) mindParts.push('learned something');
    if (mindParts.length) parts.push(`Mind: ${mindParts.join(', ')}`);

    const discParts = [];
    if (todayHabits.nofap) discParts.push(`NoFap day ${noFapStreak}`);
    if (todayHabits.workout) discParts.push('workout done');
    if (todayHabits.run && todayMetrics.runDistance) {
      discParts.push(`run ${todayMetrics.runDistance} km`);
    } else if (todayHabits.run) {
      discParts.push('run done');
    }
    if (todayHabits.integrity) discParts.push('integrity kept');
    if (todayHabits.healthyEating) discParts.push('ate healthy');
    if (discParts.length) parts.push(`Discipline: ${discParts.join(', ')}`);

    return parts.length ? parts.join('. ') + '.' : 'No data logged yet.';
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold text-white mb-1">Today</h1>
        <p className="text-slate-400 text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <DailyScoreCard
        score={dailyScore}
        weeklyAvg={weeklyAvg}
        lastWeekAvg={lastWeekAvg}
        onShowBreakdown={() => setShowScoreBreakdown(true)}
      />

      <ScoreBreakdownModal
        isOpen={showScoreBreakdown}
        onClose={() => setShowScoreBreakdown(false)}
        score={dailyScore}
        date={today}
      />

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

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Core Metrics</h2>
        <div className="grid gap-3">
          <MetricInput
            label="Steps"
            value={todayMetrics.steps}
            onChange={(v) => updateMetric('steps', v)}
            placeholder="0"
            goal={goals?.steps || 10000}
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

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Discipline</h2>
        {focusHabit && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs rounded-xl px-3 py-2">
            Weekly focus: {focusHabit.replace(/([A-Z])/g, ' $1').trim()}
          </div>
        )}
        <div className="space-y-2">
          <HabitToggle
            label="NoFap - Clean today"
            value={todayHabits.nofap}
            onChange={(v) => updateHabit('nofap', v)}
            streak={noFapStreak}
            isFocus={focusHabit === 'nofap'}
          />
          <HabitToggle
            label="Workout"
            value={todayHabits.workout}
            onChange={(v) => updateHabit('workout', v)}
            streak={workoutStreak}
            isFocus={focusHabit === 'workout'}
          />
          <HabitToggle
            label="Run"
            value={todayHabits.run}
            onChange={(v) => updateHabit('run', v)}
            isFocus={focusHabit === 'run'}
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
          <HabitToggle
            label="Kept my word"
            value={todayHabits.keptWord}
            onChange={(v) => updateHabit('keptWord', v)}
            isFocus={focusHabit === 'keptWord'}
          />
          <HabitToggle
            label="Did a hard thing voluntarily"
            value={todayHabits.hardThing}
            onChange={(v) => updateHabit('hardThing', v)}
            isFocus={focusHabit === 'hardThing'}
          />
          <HabitToggle
            label="Acted with integrity"
            value={todayHabits.integrity}
            onChange={(v) => updateHabit('integrity', v)}
            isFocus={focusHabit === 'integrity'}
          />
          <HabitToggle
            label="Ate healthy (no sugar)"
            value={todayHabits.healthyEating}
            onChange={(v) => updateHabit('healthyEating', v)}
            isFocus={focusHabit === 'healthyEating'}
          />
        </div>
      </div>

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

      <Card className="p-4 bg-slate-800/30">
        <h3 className="text-slate-400 text-sm font-medium mb-2">Daily Summary</h3>
        <p className="text-slate-300 text-sm leading-relaxed">
          {generateSummary()}
        </p>
      </Card>

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

export default TodayPage;
