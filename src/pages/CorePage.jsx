import { useMemo, useState } from 'react';

import { Button, Card, HabitToggle, Modal } from '../components';
import { calculateStreak, formatDate, generateId, getDaysAgo, getMonthStart, getToday, getWeekStart } from '../utils';

const CorePage = ({
  habits,
  setHabits,
  focusHabit,
  weeklyGoals,
  setWeeklyGoals,
  monthlyGoals,
  setMonthlyGoals,
  gameSessions,
  setGameSessions,
  gameLimitMinutes,
  setGameLimitMinutes
}) => {
  const today = getToday();
  const weekStart = getWeekStart(today);
  const monthStart = getMonthStart(today);

  const currentWeeklyGoal = weeklyGoals?.[weekStart];
  const currentMonthlyGoal = monthlyGoals?.[monthStart];
  const weeklyItems = currentWeeklyGoal?.items || [];
  const monthlyItems = currentMonthlyGoal?.items || [];

  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [weeklyGoalDraft, setWeeklyGoalDraft] = useState(
    weeklyItems.map(item => item.text).join('\n')
  );
  const [monthlyGoalDraft, setMonthlyGoalDraft] = useState(
    monthlyItems.map(item => item.text).join('\n')
  );
  const [historyDate, setHistoryDate] = useState(today);
  const [showGameModal, setShowGameModal] = useState(false);
  const [newGameSession, setNewGameSession] = useState({
    date: today,
    hours: '',
    minutes: ''
  });

  const todayHabits = habits[today] || {};

  const updateHabit = (key, value) => {
    setHabits(prev => ({
      ...prev,
      [today]: { ...prev[today], [key]: value }
    }));
  };

  const noFapStreak = calculateStreak(habits, 'nofap');

  const weekStats = useMemo(() => {
    const counts = {
      nofap: 0,
      healthyEating: 0,
      focus: 0
    };

    for (let i = 0; i < 7; i++) {
      const date = getDaysAgo(i);
      const dayHabits = habits[date] || {};
      if (dayHabits.nofap) counts.nofap++;
      if (dayHabits.healthyEating) counts.healthyEating++;
      if (focusHabit && dayHabits[focusHabit]) counts.focus++;
    }

    return counts;
  }, [habits, focusHabit]);

  const yearProgress = useMemo(() => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const nextYearStart = new Date(now.getFullYear() + 1, 0, 1);
    const elapsedDays = Math.floor((now - yearStart) / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = Math.round((nextYearStart - yearStart) / (1000 * 60 * 60 * 24));
    const percent = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
    return { percent, elapsedDays, totalDays };
  }, []);

  const historyDates = useMemo(() => {
    const year = new Date().getFullYear();
    return Array.from({ length: 14 }, (_, i) => getDaysAgo(i))
      .filter((date) => new Date(date).getFullYear() === year);
  }, []);

  const historyHabits = habits[historyDate] || {};

  const goalStatus = (entry) => {
    if (!entry) return { label: 'Not set', tone: 'text-slate-500', bg: 'bg-slate-800' };
    const items = entry.items || [];
    const hasItems = items.length > 0;
    const completed = hasItems && items.every(item => item.doneAt);
    if (completed) return { label: 'Completed', tone: 'text-emerald-300', bg: 'bg-emerald-500/20' };
    if (entry.dismissedAt && !hasItems) return { label: 'Skipped', tone: 'text-slate-400', bg: 'bg-slate-700/60' };
    if (hasItems) return { label: 'Active', tone: 'text-amber-300', bg: 'bg-amber-500/20' };
    return { label: 'Not set', tone: 'text-slate-500', bg: 'bg-slate-800' };
  };

  const weeklyStatus = goalStatus(currentWeeklyGoal);
  const monthlyStatus = goalStatus(currentMonthlyGoal);

  const weeklyHistory = useMemo(() => {
    return Object.entries(weeklyGoals || {})
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6);
  }, [weeklyGoals]);

  const monthlyHistory = useMemo(() => {
    return Object.entries(monthlyGoals || {})
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6);
  }, [monthlyGoals]);

  const weekStartDate = new Date(weekStart);
  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = formatDate(weekEnd);
  const weeklyGameSessions = useMemo(() => {
    return (gameSessions || []).filter(session =>
      session.date >= weekStart && session.date <= weekEndStr
    );
  }, [gameSessions, weekStart, weekEndStr]);
  const weeklyGameMinutes = weeklyGameSessions.reduce((sum, session) => sum + (session.minutes || 0), 0);
  const weeklyGameHours = weeklyGameMinutes / 60;
  const gameProgressPct = gameLimitMinutes > 0
    ? Math.min(100, Math.round((weeklyGameMinutes / gameLimitMinutes) * 100))
    : 0;
  const recentGameSessions = useMemo(() => {
    return [...(gameSessions || [])]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }, [gameSessions]);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-start justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Core</h1>
          <p className="text-slate-400 text-sm">Commitments, habits, and goals</p>
        </div>
        <Button
          variant="ghost"
          className="border border-slate-800"
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'log' }))}
        >
          Edit Past Days
        </Button>
      </div>

      <div className="px-1">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
          <span>Year</span>
          <span>{yearProgress.percent}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full"
            style={{ width: `${yearProgress.percent}%` }}
          />
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Goals</h3>
          <Button variant="secondary" className="px-3 py-2" onClick={() => {
            setWeeklyGoalDraft((currentWeeklyGoal?.items || []).map(item => item.text).join('\n'));
            setMonthlyGoalDraft((currentMonthlyGoal?.items || []).map(item => item.text).join('\n'));
            setShowGoalsModal(true);
          }}>
            Edit
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-slate-400 text-xs">Weekly goals (starting {weekStart})</div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${weeklyStatus.bg} ${weeklyStatus.tone}`}>
                {weeklyStatus.label}
              </span>
            </div>
            {weeklyItems.length > 0 ? (
              <div className="space-y-2">
                {weeklyItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2 text-sm">
                    <span className={`text-slate-200 ${item.doneAt ? 'line-through text-slate-500' : ''}`}>
                      {item.text}
                    </span>
                    <button
                      className={`px-2 py-1 rounded-lg text-xs ${
                        item.doneAt ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}
                      onClick={() => {
                        const nextItems = weeklyItems.map(it => it.id === item.id ? {
                          ...it,
                          doneAt: it.doneAt ? null : today
                        } : it);
                        setWeeklyGoals(prev => ({
                          ...prev,
                          [weekStart]: {
                            ...(prev?.[weekStart] || {}),
                            items: nextItems,
                            completedAt: nextItems.every(it => it.doneAt) ? today : null,
                            dismissedAt: null
                          }
                        }));
                      }}
                    >
                      {item.doneAt ? 'Done' : 'Check'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-200 text-sm">Not set yet.</div>
            )}
            <div className="flex gap-2 mt-2">
              {weeklyItems.length > 0 && (
                <Button
                  variant="secondary"
                  className="px-3 py-2"
                  onClick={() => {
                    const isComplete = weeklyItems.every(item => item.doneAt);
                    const nextItems = weeklyItems.map(item => ({
                      ...item,
                      doneAt: isComplete ? null : today
                    }));
                    setWeeklyGoals(prev => ({
                      ...prev,
                      [weekStart]: {
                        ...(prev?.[weekStart] || {}),
                        items: nextItems,
                        completedAt: isComplete ? null : today,
                        dismissedAt: null
                      }
                    }));
                  }}
                >
                  {weeklyItems.every(item => item.doneAt) ? 'Mark not done' : 'Mark all done'}
                </Button>
              )}
              {weeklyItems.length === 0 && !currentWeeklyGoal?.dismissedAt && (
                <Button
                  variant="ghost"
                  className="px-3 py-2 border border-slate-700"
                  onClick={() => setWeeklyGoals(prev => ({
                    ...prev,
                    [weekStart]: { items: [], dismissedAt: today }
                  }))}
                >
                  Skip this week
                </Button>
              )}
            </div>
          </div>
          <div className="border-t border-slate-700/60 pt-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-slate-400 text-xs">Monthly goals (starting {monthStart})</div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${monthlyStatus.bg} ${monthlyStatus.tone}`}>
                {monthlyStatus.label}
              </span>
            </div>
            {monthlyItems.length > 0 ? (
              <div className="space-y-2">
                {monthlyItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2 text-sm">
                    <span className={`text-slate-200 ${item.doneAt ? 'line-through text-slate-500' : ''}`}>
                      {item.text}
                    </span>
                    <button
                      className={`px-2 py-1 rounded-lg text-xs ${
                        item.doneAt ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}
                      onClick={() => {
                        const nextItems = monthlyItems.map(it => it.id === item.id ? {
                          ...it,
                          doneAt: it.doneAt ? null : today
                        } : it);
                        setMonthlyGoals(prev => ({
                          ...prev,
                          [monthStart]: {
                            ...(prev?.[monthStart] || {}),
                            items: nextItems,
                            completedAt: nextItems.every(it => it.doneAt) ? today : null,
                            dismissedAt: null
                          }
                        }));
                      }}
                    >
                      {item.doneAt ? 'Done' : 'Check'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-200 text-sm">Not set yet.</div>
            )}
            <div className="flex gap-2 mt-2">
              {monthlyItems.length > 0 && (
                <Button
                  variant="secondary"
                  className="px-3 py-2"
                  onClick={() => {
                    const isComplete = monthlyItems.every(item => item.doneAt);
                    const nextItems = monthlyItems.map(item => ({
                      ...item,
                      doneAt: isComplete ? null : today
                    }));
                    setMonthlyGoals(prev => ({
                      ...prev,
                      [monthStart]: {
                        ...(prev?.[monthStart] || {}),
                        items: nextItems,
                        completedAt: isComplete ? null : today,
                        dismissedAt: null
                      }
                    }));
                  }}
                >
                  {monthlyItems.every(item => item.doneAt) ? 'Mark not done' : 'Mark all done'}
                </Button>
              )}
              {monthlyItems.length === 0 && !currentMonthlyGoal?.dismissedAt && (
                <Button
                  variant="ghost"
                  className="px-3 py-2 border border-slate-700"
                  onClick={() => setMonthlyGoals(prev => ({
                    ...prev,
                    [monthStart]: { items: [], dismissedAt: today }
                  }))}
                >
                  Skip this month
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {focusHabit && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/20">
          <div className="text-amber-300 text-sm">
            Weekly focus: {focusHabit.replace(/([A-Z])/g, ' $1').trim()}
          </div>
          <div className="text-slate-400 text-xs mt-1">
            {weekStats.focus}/7 days hit
          </div>
        </Card>
      )}

      <Card className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Habits</h3>
        <HabitToggle
          label="NoFap - Clean today"
          value={todayHabits.nofap}
          onChange={(v) => updateHabit('nofap', v)}
          streak={noFapStreak}
          isFocus={focusHabit === 'nofap'}
        />
        <HabitToggle
          label="Ate healthy (no sugar)"
          value={todayHabits.healthyEating}
          onChange={(v) => updateHabit('healthyEating', v)}
          isFocus={focusHabit === 'healthyEating'}
        />
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Gaming</h3>
          <Button variant="secondary" className="px-3 py-2" onClick={() => {
            setNewGameSession({ date: today, hours: '', minutes: '' });
            setShowGameModal(true);
          }}>
            Add Session
          </Button>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>This week</span>
          <span className="text-white font-semibold">{weeklyGameHours.toFixed(1)}h / {(gameLimitMinutes / 60).toFixed(0)}h</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              gameProgressPct >= 100 ? 'bg-red-500' : 'bg-amber-400'
            }`}
            style={{ width: `${gameProgressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Weekly limit</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={Math.round(gameLimitMinutes / 60)}
              onChange={(e) => setGameLimitMinutes(Math.max(0, Number(e.target.value)) * 60)}
              className="w-16 bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-white text-right"
            />
            <span>hours</span>
          </div>
        </div>
        {recentGameSessions.length > 0 && (
          <div className="space-y-2">
            {recentGameSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2 text-sm">
                <span className="text-slate-300">
                  {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{(session.minutes / 60).toFixed(1)}h</span>
                  <button
                    className="text-xs text-red-400 hover:text-red-300"
                    onClick={() => setGameSessions(prev => prev.filter(s => s.id !== session.id))}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-3">7-day Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-amber-400">{weekStats.nofap}</div>
            <div className="text-slate-500 text-xs">NoFap Days</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sky-400">{weekStats.healthyEating}</div>
            <div className="text-slate-500 text-xs">Healthy Eating</div>
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
          {[
            { key: 'nofap', label: 'NoFap' },
            { key: 'healthyEating', label: 'Healthy Eating' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2">
              <span className="text-slate-300">{label}</span>
              <span className={historyHabits[key] ? 'text-emerald-400' : 'text-slate-600'}>
                {historyHabits[key] ? 'Yes' : 'No'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-3">Goals History</h3>
        <div className="space-y-4">
          <div>
            <div className="text-slate-500 text-xs mb-2">Weekly</div>
            <div className="space-y-2">
              {weeklyHistory.map(([date, entry]) => (
                <div key={date} className="bg-slate-900/50 rounded-xl px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">Week of {date}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${goalStatus(entry).bg} ${goalStatus(entry).tone}`}>
                      {goalStatus(entry).label}
                    </span>
                  </div>
                  {entry.items && entry.items.length > 0 ? (
                    <ul className="text-slate-200 mt-1 space-y-1">
                      {entry.items.map(item => (
                        <li key={item.id} className={item.doneAt ? 'line-through text-slate-500' : ''}>
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-slate-500 mt-1">No goals set</div>
                  )}
                </div>
              ))}
              {weeklyHistory.length === 0 && (
                <div className="text-slate-500 text-sm">No weekly goals yet.</div>
              )}
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-2">Monthly</div>
            <div className="space-y-2">
              {monthlyHistory.map(([date, entry]) => (
                <div key={date} className="bg-slate-900/50 rounded-xl px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">Month of {date}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${goalStatus(entry).bg} ${goalStatus(entry).tone}`}>
                      {goalStatus(entry).label}
                    </span>
                  </div>
                  {entry.items && entry.items.length > 0 ? (
                    <ul className="text-slate-200 mt-1 space-y-1">
                      {entry.items.map(item => (
                        <li key={item.id} className={item.doneAt ? 'line-through text-slate-500' : ''}>
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-slate-500 mt-1">No goals set</div>
                  )}
                </div>
              ))}
              {monthlyHistory.length === 0 && (
                <div className="text-slate-500 text-sm">No monthly goals yet.</div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
        title="Edit Goals"
      >
        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Weekly goals (starting {weekStart})</label>
            <textarea
              value={weeklyGoalDraft}
              onChange={(e) => setWeeklyGoalDraft(e.target.value)}
              placeholder="One goal per line..."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
              rows={4}
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Monthly goals (starting {monthStart})</label>
            <textarea
              value={monthlyGoalDraft}
              onChange={(e) => setMonthlyGoalDraft(e.target.value)}
              placeholder="One goal per line..."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
              rows={4}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => {
              if (weeklyGoalDraft.trim()) {
                const items = weeklyGoalDraft
                  .split('\n')
                  .map(line => line.trim())
                  .filter(Boolean)
                  .map(text => ({ id: generateId(), text, doneAt: null }));
                setWeeklyGoals(prev => ({
                  ...prev,
                  [weekStart]: {
                    ...(prev?.[weekStart] || {}),
                    items,
                    savedAt: today,
                    dismissedAt: null
                  }
                }));
              }
              if (monthlyGoalDraft.trim()) {
                const items = monthlyGoalDraft
                  .split('\n')
                  .map(line => line.trim())
                  .filter(Boolean)
                  .map(text => ({ id: generateId(), text, doneAt: null }));
                setMonthlyGoals(prev => ({
                  ...prev,
                  [monthStart]: {
                    ...(prev?.[monthStart] || {}),
                    items,
                    savedAt: today,
                    dismissedAt: null
                  }
                }));
              }
              setShowGoalsModal(false);
            }}
            disabled={!weeklyGoalDraft.trim() && !monthlyGoalDraft.trim()}
          >
            Save Goals
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showGameModal}
        onClose={() => setShowGameModal(false)}
        title="Add Gaming Session"
      >
        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Date</label>
            <input
              type="date"
              value={newGameSession.date}
              onChange={(e) => setNewGameSession(prev => ({ ...prev, date: e.target.value }))}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Duration</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={newGameSession.hours}
                onChange={(e) => setNewGameSession(prev => ({ ...prev, hours: e.target.value }))}
                placeholder="Hours"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
              />
              <input
                type="number"
                value={newGameSession.minutes}
                onChange={(e) => setNewGameSession(prev => ({ ...prev, minutes: e.target.value }))}
                placeholder="Minutes"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              const totalMinutes = (Number(newGameSession.hours) || 0) * 60 + (Number(newGameSession.minutes) || 0);
              if (!totalMinutes) return;
              setGameSessions(prev => ([
                ...prev,
                {
                  id: generateId(),
                  date: newGameSession.date,
                  minutes: totalMinutes
                }
              ]));
              setShowGameModal(false);
            }}
            disabled={!Number(newGameSession.hours) && !Number(newGameSession.minutes)}
          >
            Save Session
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CorePage;
