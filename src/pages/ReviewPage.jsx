import { useMemo, useState } from 'react';

import { Button, Card, Modal, TabBar } from '../components';
import { calculateDailyScore, formatDate, getMonthStart, getToday, getWeekStart } from '../utils';

const ReviewPage = ({
  metrics,
  habits,
  transactions,
  journals,
  goals,
  focusHabit,
  readingSessions,
  reviews,
  setReviews
}) => {
  const [reviewType, setReviewType] = useState('weekly');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSeed, setReviewSeed] = useState(null);

  const today = getToday();
  const weekStart = getWeekStart(today);
  const monthStart = getMonthStart(today);

  const sessionsByDate = useMemo(() => {
    const map = {};
    readingSessions.forEach((session) => {
      map[session.date] = (map[session.date] || 0) + session.pages;
    });
    return map;
  }, [readingSessions]);

  const getReviewStats = (startDate, endDate) => {
    const msDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.floor((new Date(endDate) - new Date(startDate)) / msDay) + 1;
    let sleepTotal = 0, sleepCount = 0;
    let stepsTotal = 0, stepsCount = 0;
    let waterTotal = 0, waterCount = 0;
    let pagesTotal = 0;
    let pushupsTotal = 0;
    let squatsTotal = 0;
    let runDistanceTotal = 0;
    let workoutDays = 0, runDays = 0;
    let focusHabitDays = 0;
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
      const sessionPages = sessionsByDate[dateStr] || 0;
      if (dayMetrics?.pages || sessionPages) pagesTotal += (dayMetrics?.pages || 0) + sessionPages;
      if (dayMetrics?.pushups) pushupsTotal += dayMetrics.pushups;
      if (dayMetrics?.squats) squatsTotal += dayMetrics.squats;
      if (dayMetrics?.runDistance) runDistanceTotal += dayMetrics.runDistance;

      if (dayHabits?.workout) workoutDays++;
      if (dayHabits?.run) runDays++;
      if (focusHabit && dayHabits?.[focusHabit]) focusHabitDays++;

      date.setDate(date.getDate() + 1);
    }

    transactions.forEach(t => {
      if (t.date >= startDate && t.date <= endDate) {
        if (t.type === 'income') income += t.amount;
        else expenses += t.amount;
      }
    });

    return {
      avgSleep: sleepCount ? (sleepTotal / sleepCount).toFixed(1) : 'n/a',
      avgSteps: stepsCount ? Math.round(stepsTotal / stepsCount) : 'n/a',
      avgWater: waterCount ? (waterTotal / waterCount).toFixed(1) : 'n/a',
      totalPages: pagesTotal,
      totalPushups: pushupsTotal,
      totalSquats: squatsTotal,
      totalRunDistance: runDistanceTotal,
      avgScore: scoreCount ? Math.round(scoreTotal / scoreCount) : 0,
      workoutDays,
      runDays,
      income,
      expenses,
      net: income - expenses,
      loggedDays,
      focusHabitDays,
      focusHabitPct: focusHabit ? Math.round((focusHabitDays / totalDays) * 100) : null
    };
  };

  const weeklyStats = getReviewStats(weekStart, today);
  const monthlyStats = getReviewStats(monthStart, today);

  const stats = reviewType === 'weekly' ? weeklyStats : monthlyStats;
  const reviewPeriodStart = reviewType === 'weekly' ? weekStart : monthStart;
  const reviewKey = `${reviewType}:${reviewPeriodStart}`;
  const existingReview = reviews?.[reviewKey] || null;

  const autoSummary = useMemo(() => {
    const periodLabel = reviewType === 'weekly' ? 'Week' : 'Month';
    const daysTotal = reviewType === 'weekly' ? 7 : 30;
    const loggedPct = Math.round((stats.loggedDays / daysTotal) * 100);
    const focusSummary = focusHabit && stats.focusHabitPct !== null
      ? ` Focus habit hit ${stats.focusHabitPct}%.`
      : '';
    const netLabel = stats.net >= 0 ? `Saved €${stats.net.toFixed(0)}.` : `Overspent €${Math.abs(stats.net).toFixed(0)}.`;
    return `${periodLabel} of ${reviewPeriodStart}: ${stats.loggedDays}/${daysTotal} days logged (${loggedPct}%). Avg score ${stats.avgScore}. Avg sleep ${stats.avgSleep}h, steps ${typeof stats.avgSteps === 'number' ? stats.avgSteps.toLocaleString() : stats.avgSteps}. Workouts ${stats.workoutDays}, runs ${stats.runDays}, pages ${stats.totalPages}, push-ups ${stats.totalPushups}, squats ${stats.totalSquats}. ${netLabel}${focusSummary}`;
  }, [reviewType, reviewPeriodStart, stats, focusHabit]);

  const promptSuggestions = useMemo(() => {
    const prompts = [];
    if (stats.avgScore < 60) {
      prompts.push('What was the biggest blocker this period, and how do you remove it?');
    }
    if (stats.focusHabitPct !== null && stats.focusHabitPct < 50) {
      prompts.push(`Why did you miss your focus habit (${focusHabit}) this period?`);
    }
    if (stats.net < 0) {
      prompts.push('Which spending category surprised you, and what rule will you set?');
    }
    if (stats.loggedDays < (reviewType === 'weekly' ? 5 : 20)) {
      prompts.push('What would make logging easier next period?');
    }
    if (prompts.length < 3) {
      prompts.push('What is the single highest‑leverage change for next period?');
    }
    return prompts.slice(0, 3);
  }, [stats, focusHabit, reviewType]);

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
              {stats.avgScore >= 70 ? 'Great performance!' :
               stats.avgScore >= 50 ? 'Solid effort!' :
               'Room to grow'}
            </div>
          </div>
        </Card>
      )}

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
          <div className="text-slate-400 text-sm">Squats</div>
          <div className="text-2xl font-bold text-orange-400">{stats.totalSquats.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-slate-400 text-sm">Run Distance</div>
          <div className="text-2xl font-bold text-sky-400">{stats.totalRunDistance.toFixed(1)} km</div>
        </Card>
        <Card className="p-4">
          <div className="text-slate-400 text-sm">Workout Days</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.workoutDays}</div>
        </Card>
        <Card className="p-4">
          <div className="text-slate-400 text-sm">Run Days</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.runDays}</div>
        </Card>
        {focusHabit && (
          <Card className="p-4">
            <div className="text-slate-400 text-sm">Focus Habit</div>
            <div className="text-2xl font-bold text-amber-400">{stats.focusHabitPct}%</div>
            <div className="text-slate-500 text-xs">{focusHabit.replace(/([A-Z])/g, ' $1').trim()}</div>
          </Card>
        )}
      </div>

      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-3">Money Summary</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-emerald-400 text-xl font-bold">€{stats.income.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">Income</div>
          </div>
          <div>
            <div className="text-red-400 text-xl font-bold">€{stats.expenses.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">Spent</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${stats.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              €{Math.abs(stats.net).toFixed(0)}
            </div>
            <div className="text-slate-500 text-xs">Net</div>
          </div>
        </div>
      </Card>

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

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-400 text-sm">Auto Summary</h3>
          <Button
            variant="secondary"
            className="px-3 py-2"
            onClick={() => {
              setReviewSeed({ summary: autoSummary });
              setShowReviewForm(true);
            }}
          >
            Use in Review
          </Button>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{autoSummary}</p>
        <div className="mt-3 space-y-2">
          {promptSuggestions.map((prompt) => (
            <div key={prompt} className="text-xs text-slate-500">
              - {prompt}
            </div>
          ))}
        </div>
      </Card>

      {existingReview && (
        <Card className="p-4">
          <h3 className="font-semibold text-white mb-3">Your Reflection</h3>
          {existingReview.summary && (
            <div className="mb-3">
              <div className="text-amber-400 text-xs mb-1">Summary</div>
              <div className="text-slate-300 text-sm whitespace-pre-wrap">{existingReview.summary}</div>
            </div>
          )}
          {existingReview.win && (
            <div className="mb-3">
              <div className="text-amber-400 text-xs mb-1">Biggest win</div>
              <div className="text-slate-300 text-sm whitespace-pre-wrap">{existingReview.win}</div>
            </div>
          )}
          {existingReview.lesson && (
            <div className="mb-3">
              <div className="text-amber-400 text-xs mb-1">Lesson / failure</div>
              <div className="text-slate-300 text-sm whitespace-pre-wrap">{existingReview.lesson}</div>
            </div>
          )}
          {existingReview.standard && (
            <div className="mb-3">
              <div className="text-amber-400 text-xs mb-1">Standard to raise</div>
              <div className="text-slate-300 text-sm whitespace-pre-wrap">{existingReview.standard}</div>
            </div>
          )}
          {reviewType === 'monthly' && existingReview.yearReflection && (
            <div>
              <div className="text-violet-400 text-xs mb-1">If this repeats for a year...</div>
              <div className="text-slate-300 text-sm whitespace-pre-wrap">{existingReview.yearReflection}</div>
            </div>
          )}
        </Card>
      )}

      <Button className="w-full" onClick={() => setShowReviewForm(true)}>
        {existingReview ? 'Edit' : 'Write'} {reviewType === 'weekly' ? 'Weekly' : 'Monthly'} Review
      </Button>

      <Modal
        isOpen={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        title={`${reviewType === 'weekly' ? 'Weekly' : 'Monthly'} Review`}
      >
        <ReviewForm
          type={reviewType}
          initial={existingReview || reviewSeed || { summary: autoSummary }}
          onSave={(data) => {
            setReviews(prev => ({
              ...prev,
              [reviewKey]: {
                ...data,
                type: reviewType,
                periodStart: reviewPeriodStart,
                savedAt: getToday()
              }
            }));
            setReviewSeed(null);
            setShowReviewForm(false);
          }}
        />
      </Modal>
    </div>
  );
};

const ReviewForm = ({ type, initial, onSave }) => {
  const [summary, setSummary] = useState(initial?.summary || '');
  const [win, setWin] = useState(initial?.win || '');
  const [lesson, setLesson] = useState(initial?.lesson || '');
  const [standard, setStandard] = useState(initial?.standard || '');
  const [yearReflection, setYearReflection] = useState(initial?.yearReflection || '');

  return (
    <div className="space-y-4">
      <div>
        <label className="text-amber-400 text-sm mb-2 block">Summary</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Auto summary or your own..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
          rows={3}
        />
      </div>
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
      <Button
        className="w-full"
        onClick={() => onSave({ summary, win, lesson, standard, yearReflection })}
      >
        Save Review
      </Button>
    </div>
  );
};

export default ReviewPage;
