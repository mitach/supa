import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, Icons, TabBar } from '../components';
import { calculateDailyScore, calculateStreak, formatDate, getDaysAgo, getToday } from '../utils';

const AnalyticsPage = ({ metrics, habits, transactions, goals, focusHabit, readingSessions, mediaSessions, library }) => {
  const [range, setRange] = useState('week');

  const rangeConfig = {
    week: { days: 7, label: 'This Week' },
    month: { days: 30, label: 'This Month' },
    quarter: { days: 90, label: 'Last 90 Days' }
  };

  const libraryById = useMemo(() => {
    const map = {};
    library.forEach(item => {
      map[item.id] = item;
    });
    return map;
  }, [library]);

  const sessionsByDate = useMemo(() => {
    const map = {};
    readingSessions.forEach((session) => {
      map[session.date] = (map[session.date] || 0) + session.pages;
    });
    return map;
  }, [readingSessions]);

  const chartData = useMemo(() => {
    const days = rangeConfig[range].days;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = getDaysAgo(i);
      const dayMetrics = metrics[date] || {};
      const dayHabits = habits[date] || {};
      const sessionPages = sessionsByDate[date] || 0;

      const metricsWithPages = { ...dayMetrics, pages: (dayMetrics.pages || 0) + sessionPages };

      data.push({
        date,
        label: new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        steps: dayMetrics.steps || 0,
        water: dayMetrics.water || 0,
        sleep: dayMetrics.sleep || 0,
        pages: metricsWithPages.pages,
        pushups: dayMetrics.pushups || 0,
        runDistance: dayMetrics.runDistance || 0,
        nofap: dayHabits.nofap ? 1 : 0,
        workout: dayHabits.workout ? 1 : 0,
        score: calculateDailyScore(metricsWithPages, dayHabits, goals, {}).score,
      });
    }

    return data;
  }, [metrics, habits, range, goals, sessionsByDate]);

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

  const scoreStats = useMemo(() => {
    const scores = chartData.filter(d => d.score > 0);
    if (scores.length === 0) return { avg: 0, best: 0, bestDate: null };

    const avg = Math.round(scores.reduce((sum, d) => sum + d.score, 0) / scores.length);
    const best = Math.max(...scores.map(d => d.score));
    const bestDay = scores.find(d => d.score === best);

    return { avg, best, bestDate: bestDay?.date };
  }, [chartData]);

  const pushupStats = useMemo(() => {
    const periodTotal = chartData.reduce((sum, d) => sum + d.pushups, 0);

    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const today = getToday();

    let ytdTotal = 0;
    let ytdDaysWithData = 0;

    const startOfYear = new Date(currentYear, 0, 1);
    const now = new Date();
    const daysInYearSoFar = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;

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

  const runStats = useMemo(() => {
    const periodTotal = chartData.reduce((sum, d) => sum + d.runDistance, 0);

    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const today = getToday();

    let ytdTotal = 0;
    const startOfYear = new Date(currentYear, 0, 1);
    const now = new Date();
    const daysInYearSoFar = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;

    Object.keys(metrics).forEach(date => {
      if (date >= yearStart && date <= today && metrics[date]?.runDistance) {
        ytdTotal += metrics[date].runDistance;
      }
    });

    const ytdAvgPerDay = daysInYearSoFar > 0 ? (ytdTotal / daysInYearSoFar).toFixed(2) : 0;

    return {
      periodTotal,
      ytdTotal,
      ytdAvgPerDay,
      daysInYearSoFar
    };
  }, [chartData, metrics]);

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

  const habitStats = useMemo(() => {
    const days = rangeConfig[range].days;
    let workoutDays = 0;
    let runDays = 0;
    let keptWordDays = 0;
    let hardThingDays = 0;
    let healthyEatingDays = 0;
    let focusHabitDays = 0;
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
        if (dayHabits.healthyEating) healthyEatingDays++;
        if (focusHabit && dayHabits[focusHabit]) focusHabitDays++;
      }
    }

    const pct = (n) => loggedDays ? Math.round((n / loggedDays) * 100) : 0;
    const focusPct = focusHabit ? Math.round((focusHabitDays / days) * 100) : null;

    return {
      workout: pct(workoutDays),
      run: pct(runDays),
      keptWord: pct(keptWordDays),
      hardThing: pct(hardThingDays),
      healthyEating: pct(healthyEatingDays),
      focusPct,
      loggedDays
    };
  }, [habits, range, focusHabit]);

  const moneyStats = useMemo(() => {
    const days = rangeConfig[range].days;
    const startDate = getDaysAgo(days - 1);

    const periodTransactions = transactions.filter(t => t.date >= startDate);
    const income = periodTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = periodTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses, net: income - expenses };
  }, [transactions, range]);

  const readingTimeStats = useMemo(() => {
    const days = rangeConfig[range].days;
    const startDate = getDaysAgo(days - 1);
    const periodSessions = readingSessions.filter(s => s.date >= startDate);
    const periodMinutes = periodSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const ytdMinutes = readingSessions
      .filter(s => s.date >= yearStart)
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    return { periodMinutes, ytdMinutes };
  }, [readingSessions, range]);

  const mediaStats = useMemo(() => {
    const days = rangeConfig[range].days;
    const startDate = getDaysAgo(days - 1);
    const periodSessions = mediaSessions.filter(s => s.date >= startDate);
    const totalsByType = { series: 0, course: 0, podcast: 0 };
    periodSessions.forEach(session => {
      const item = libraryById[session.itemId];
      if (!item) return;
      if (totalsByType[item.type] !== undefined) {
        totalsByType[item.type] += session.durationMinutes || 0;
      }
    });

    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const ytdSessions = mediaSessions.filter(s => s.date >= yearStart);
    let ytdTotalMinutes = 0;
    ytdSessions.forEach(session => {
      const item = libraryById[session.itemId];
      if (!item) return;
      if (['series', 'course', 'podcast'].includes(item.type)) {
        ytdTotalMinutes += session.durationMinutes || 0;
      }
    });

    return {
      totalsByType,
      periodTotalMinutes: Object.values(totalsByType).reduce((sum, v) => sum + v, 0),
      ytdTotalMinutes
    };
  }, [mediaSessions, range, libraryById]);

  const heatmapWeeks = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 364);
    start.setHours(0, 0, 0, 0);
    const totalDays = 365;
    const startDay = start.getDay();
    const weeksCount = Math.ceil((startDay + totalDays) / 7);
    const weeks = Array.from({ length: weeksCount }, () => Array(7).fill(null));

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = formatDate(date);
      const dayMetrics = metrics[dateStr] || {};
      const dayHabits = habits[dateStr] || {};
      const logged = Object.keys(dayMetrics).length > 0 || Object.keys(dayHabits).length > 0;
      const score = logged ? calculateDailyScore(dayMetrics, dayHabits, goals, {}).score : 0;

      let color = 'bg-slate-800/50';
      if (logged && score >= 80) color = 'bg-emerald-500';
      else if (logged && score >= 60) color = 'bg-emerald-400/80';
      else if (logged && score >= 40) color = 'bg-amber-400/80';
      else if (logged) color = 'bg-amber-500/40';

      const weekIndex = Math.floor((startDay + i) / 7);
      const dayIndex = date.getDay();
      weeks[weekIndex][dayIndex] = {
        date: dateStr,
        score,
        logged,
        color
      };
    }

    return weeks;
  }, [metrics, habits, goals]);

  return (
    <div className="space-y-6 pb-24">
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-slate-400 text-sm">Track your progress</p>
      </div>

      <TabBar
        tabs={[
          { id: 'week', label: 'Week' },
          { id: 'month', label: 'Month' },
          { id: 'quarter', label: '90 Days' }
        ]}
        active={range}
        onChange={setRange}
      />

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

      {focusHabit && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-sm">Weekly Focus</div>
              <div className="text-2xl font-bold text-amber-400">{habitStats.focusPct}%</div>
            </div>
            <div className="text-slate-500 text-sm">
              {focusHabit.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          </div>
        </Card>
      )}

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

      <Card className="p-4">
        <div className="flex items-center gap-2 text-slate-400 mb-3">
          <Icons.Activity /> Run Distance
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-3xl font-bold text-white">{runStats.periodTotal.toFixed(1)} km</div>
            <div className="text-slate-500 text-xs">{rangeConfig[range].label}</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-amber-400">{runStats.ytdTotal.toFixed(1)} km</div>
            <div className="text-slate-500 text-xs">Year to Date</div>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Daily avg (YTD)</span>
            <span className="text-white font-semibold">{runStats.ytdAvgPerDay} km / day</span>
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
              <Bar dataKey="runDistance" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-4">Discipline Consistency</h3>
        <div className="space-y-3">
          {[
            { key: 'workout', label: 'Workout', value: habitStats.workout },
            { key: 'run', label: 'Run', value: habitStats.run },
            { key: 'keptWord', label: 'Kept Word', value: habitStats.keptWord },
            { key: 'hardThing', label: 'Hard Thing', value: habitStats.hardThing },
            { key: 'healthyEating', label: 'Ate healthy (no sugar)', value: habitStats.healthyEating },
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

      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-3">Consistency Heatmap (365 days)</h3>
        <div className="overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-max gap-1">
            {heatmapWeeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    title={day ? `${day.date} - ${day.logged ? `${day.score} pts` : 'No data'}` : 'No data'}
                    className={`w-3 h-3 rounded-sm ${day ? day.color : 'bg-slate-800/50'}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-slate-800/50" />
          <div className="w-3 h-3 rounded-sm bg-amber-500/40" />
          <div className="w-3 h-3 rounded-sm bg-amber-400/80" />
          <div className="w-3 h-3 rounded-sm bg-emerald-400/80" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span>More</span>
        </div>
      </Card>

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

      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-4">Reading Time ({rangeConfig[range].label})</h3>
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Total</span>
          <span className="text-white font-semibold">{(readingTimeStats.periodMinutes / 60).toFixed(1)}h</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
          <span>Year to date</span>
          <span>{(readingTimeStats.ytdMinutes / 60).toFixed(1)}h</span>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-4">Media Time ({rangeConfig[range].label})</h3>
        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <div>
            <div className="text-amber-400 text-xl font-bold">{(mediaStats.totalsByType.series / 60).toFixed(1)}h</div>
            <div className="text-slate-500 text-xs">Series</div>
          </div>
          <div>
            <div className="text-sky-400 text-xl font-bold">{(mediaStats.totalsByType.course / 60).toFixed(1)}h</div>
            <div className="text-slate-500 text-xs">Courses</div>
          </div>
          <div>
            <div className="text-violet-400 text-xl font-bold">{(mediaStats.totalsByType.podcast / 60).toFixed(1)}h</div>
            <div className="text-slate-500 text-xs">Podcasts</div>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Total</span>
          <span className="text-white font-semibold">{(mediaStats.periodTotalMinutes / 60).toFixed(1)}h</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
          <span>Year to date</span>
          <span>{(mediaStats.ytdTotalMinutes / 60).toFixed(1)}h</span>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
