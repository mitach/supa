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
  focusHabit,
  focusAlertLast,
  setFocusAlertLast
}) => {
  const today = getToday();
  const todayMetrics = metrics[today] || {};
  const todayHabits = habits[today] || {};
  const todayJournal = journals[today] || {};

  const [showQuickAdd, setShowQuickAdd] = useState(null);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [pagesView, setPagesView] = useState('total');
  const [showFocusAlert, setShowFocusAlert] = useState(false);
  const [journalText, setJournalText] = useState(todayJournal.text || '');
  const [tilText, setTilText] = useState(todayJournal.til || '');
  const [importantText, setImportantText] = useState(
    todayJournal.important || todayJournal.avoided || ''
  );

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
      [today]: { text: journalText, til: tilText, important: importantText }
    }));
  };

  useEffect(() => {
    const timeout = setTimeout(saveJournal, 500);
    return () => clearTimeout(timeout);
  }, [journalText, tilText, importantText]);

  useEffect(() => {
    if (!focusHabit) return;
    const yesterday = getDaysAgo(1);
    const dayBefore = getDaysAgo(2);
    const missedYesterday = !habits[yesterday]?.[focusHabit];
    const missedDayBefore = !habits[dayBefore]?.[focusHabit];
    if (!missedYesterday || !missedDayBefore) {
      setShowFocusAlert(false);
      return;
    }
    if (focusAlertLast === today) {
      setShowFocusAlert(false);
      return;
    }
    setShowFocusAlert(true);
  }, [focusHabit, habits, today, focusAlertLast]);

  const noFapStreak = calculateStreak(habits, 'nofap');
  const workoutStreak = calculateStreak(habits, 'workout');

  const todaySpend = transactions
    .filter(t => t.date === today && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const todayIncome = transactions
    .filter(t => t.date === today && t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const todaySessions = readingSessions.filter(s => s.date === today);
  const todayPagesSessions = todaySessions
    .filter(s => s.date === today)
    .reduce((sum, s) => sum + s.pages, 0);
  const todaySessionMinutes = todaySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const todayPagesTotal = (todayMetrics.pages || 0) + todayPagesSessions;

  const dailyScore = useMemo(() => {
    const metricsWithPages = { ...todayMetrics, pages: todayPagesTotal };
    return calculateDailyScore(metricsWithPages, todayHabits, goals, todayJournal);
  }, [todayMetrics, todayHabits, goals, todayJournal, todayPagesTotal]);

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
    if (todayMetrics.water) bodyParts.push('water goal met');
    if (bodyParts.length) parts.push(`Body: ${bodyParts.join(', ')}`);

    const mindParts = [];
    if (todayPagesTotal > 0) mindParts.push(`${todayPagesTotal} pages`);
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

      {showFocusAlert && (
        <Card className="p-4 bg-red-500/10 border border-red-500/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-red-400 font-semibold">Focus habit missed 2 days in a row</div>
              <div className="text-slate-400 text-sm">
                Today’s focus: {focusHabit.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
            <button
              className="text-slate-400 hover:text-white text-sm"
              onClick={() => {
                setFocusAlertLast(today);
                setShowFocusAlert(false);
              }}
            >
              Dismiss
            </button>
          </div>
        </Card>
      )}

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
            label="Ate healthy (no sugar)"
            value={todayHabits.healthyEating}
            onChange={(v) => updateHabit('healthyEating', v)}
            isFocus={focusHabit === 'healthyEating'}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Reading</h2>
        <Card className="p-4 space-y-3">
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
                  ? todayMetrics.pages || 0
                  : pagesView === 'sessions'
                    ? todayPagesSessions
                    : todayPagesTotal
              }
              onChange={(v) => {
                if (pagesView === 'sessions') return;
                if (v === null) {
                  updateMetric('pages', null);
                  return;
                }
                if (pagesView === 'manual') {
                  updateMetric('pages', v === 0 ? null : v);
                  return;
                }
                const manualPages = Math.max(0, v - todayPagesSessions);
                updateMetric('pages', manualPages === 0 ? null : manualPages);
              }}
              placeholder="0"
              disabled={pagesView === 'sessions'}
            />
            <div className="text-xs text-slate-500 px-1">
              Sessions: {todayPagesSessions} pages - Manual: {todayMetrics.pages || 0}
            </div>
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-slate-400">
              Sessions today: {todayPagesSessions} pages
              {todaySessionMinutes > 0 && (
                <span> - {Math.floor(todaySessionMinutes / 60)}h {todaySessionMinutes % 60}m</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setShowQuickAdd('reading')}>
              <span className="flex items-center justify-center gap-2">
                <Icons.Book /> Add Session
              </span>
            </Button>
            <Button
              variant="ghost"
              className="border border-slate-700"
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'library' }))}
            >
              <span className="flex items-center justify-center gap-2">
                <Icons.Plus /> Library
              </span>
            </Button>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Money</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="text-slate-400 text-sm mb-1">Spent Today</div>
            <div className="text-2xl font-bold text-red-400">€{todaySpend.toFixed(2)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-slate-400 text-sm mb-1">Earned Today</div>
            <div className="text-2xl font-bold text-emerald-400">€{todayIncome.toFixed(2)}</div>
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
          <label className="text-slate-400 text-sm mb-2 block">Something important happened today</label>
          <textarea
            value={importantText}
            onChange={(e) => setImportantText(e.target.value)}
            placeholder="What happened?"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50 transition-all"
            rows={2}
          />
        </Card>
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
        {(() => {
          const normalizeStatus = (status) => {
            if (!status) return '';
            return status.toString().toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');
          };
          const bookItems = library.filter(i => i.type === 'book');
          const inProgressBooks = bookItems.filter(i => normalizeStatus(i.status) === 'in_progress');
          const plannedBooks = bookItems.filter(i => normalizeStatus(i.status) === 'planned' || !i.status);
          const sessionBooks = inProgressBooks.length > 0 ? inProgressBooks : plannedBooks;
          return (
            <ReadingSessionForm
              books={sessionBooks}
              onSave={(s) => {
                setReadingSessions(prev => [...prev, { ...s, id: generateId(), date: today }]);
                setShowQuickAdd(null);
              }}
            />
          );
        })()}
      </Modal>
    </div>
  );
};

export default TodayPage;
