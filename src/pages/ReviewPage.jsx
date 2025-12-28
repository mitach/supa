import { useState } from 'react';

import { Button, Card, Modal, TabBar } from '../components';
import { calculateDailyScore, formatDate, getMonthStart, getToday, getWeekStart } from '../utils';

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
      avgSleep: sleepCount ? (sleepTotal / sleepCount).toFixed(1) : 'n/a',
      avgSteps: stepsCount ? Math.round(stepsTotal / stepsCount) : 'n/a',
      avgWater: waterCount ? (waterTotal / waterCount).toFixed(1) : 'n/a',
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
          <div className="text-slate-400 text-sm">Workout Days</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.workoutDays}</div>
        </Card>
        <Card className="p-4">
          <div className="text-slate-400 text-sm">Run Days</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.runDays}</div>
        </Card>
      </div>

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

export default ReviewPage;
