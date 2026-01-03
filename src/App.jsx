import { useEffect, useMemo, useRef, useState } from 'react';

import { Button, Card, Icons, Modal } from './components';
import AnalyticsPage from './pages/AnalyticsPage';
import BodyPage from './pages/BodyPage';
import CorePage from './pages/CorePage';
import JournalPage from './pages/JournalPage';
import LearningPage from './pages/LearningPage';
import LibraryPage from './pages/LibraryPage';
import LogPage from './pages/LogPage';
import MindPage from './pages/MindPage';
import MoneyPage from './pages/MoneyPage';
import ReviewPage from './pages/ReviewPage';
import SettingsPage from './pages/SettingsPage';
import { supabase } from './lib/supabaseClient';
import { formatDate, generateId, getMonthStart, getToday, getWeekStart } from './utils';

  const defaultState = {
    metrics: {},
    habits: {},
    journals: {},
    transactions: [],
    library: [],
    readingSessions: [],
    mediaSessions: [],
    learningNotes: [],
    srsState: {},
    reviews: {},
    weeklyGoals: {},
    monthlyGoals: {},
    gameSessions: [],
    gameLimitMinutes: 420,
    goals: { steps: 10000, water: 1.5, sleep: 7.5, pages: 20, pushups: 50 },
    focusHabit: 'workout',
    onboardingComplete: false,
    focusAlertLast: ''
  };

export default function App() {
  const [page, setPage] = useState('body');

  const [metrics, setMetrics] = useState(defaultState.metrics);
  const [habits, setHabits] = useState(defaultState.habits);
  const [journals, setJournals] = useState(defaultState.journals);
  const [transactions, setTransactions] = useState(defaultState.transactions);
  const [library, setLibrary] = useState(defaultState.library);
  const [readingSessions, setReadingSessions] = useState(defaultState.readingSessions);
  const [mediaSessions, setMediaSessions] = useState(defaultState.mediaSessions);
  const [learningNotes, setLearningNotes] = useState(defaultState.learningNotes);
  const [srsState, setSrsState] = useState(defaultState.srsState);
  const [reviews, setReviews] = useState(defaultState.reviews);
  const [weeklyGoals, setWeeklyGoals] = useState(defaultState.weeklyGoals);
  const [monthlyGoals, setMonthlyGoals] = useState(defaultState.monthlyGoals);
  const [gameSessions, setGameSessions] = useState(defaultState.gameSessions);
  const [gameLimitMinutes, setGameLimitMinutes] = useState(defaultState.gameLimitMinutes);
  const [goals, setGoals] = useState(defaultState.goals);
  const [focusHabit, setFocusHabit] = useState(defaultState.focusHabit);
  const [onboardingComplete, setOnboardingComplete] = useState(defaultState.onboardingComplete);
  const [focusAlertLast, setFocusAlertLast] = useState(defaultState.focusAlertLast);

  const [onboardingGoals, setOnboardingGoals] = useState(defaultState.goals);
  const [onboardingFocus, setOnboardingFocus] = useState(defaultState.focusHabit);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [isHydrated, setIsHydrated] = useState(false);
  const [showGoalsPrompt, setShowGoalsPrompt] = useState(false);
  const [weeklyGoalDraft, setWeeklyGoalDraft] = useState('');
  const [monthlyGoalDraft, setMonthlyGoalDraft] = useState('');
  const [recentPages, setRecentPages] = useState(() => {
    try {
      const stored = localStorage.getItem('progress_recent_pages');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const hasHydratedRef = useRef(false);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    const handleNavigate = (e) => setPage(e.detail);
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const normalizeJournals = (input) => {
    if (!input) return {};
    return Object.fromEntries(
      Object.entries(input).map(([date, entry]) => {
        if (!entry) return [date, entry];
        const important = entry.important || entry.avoided || '';
        return [date, { ...entry, important, avoided: undefined }];
      })
    );
  };

  const normalizeGoals = (input) => {
    if (!input) return {};
    return Object.fromEntries(
      Object.entries(input).map(([periodStart, entry]) => {
        if (!entry) return [periodStart, entry];
        const existingItems = Array.isArray(entry.items) ? entry.items : null;
        if (existingItems) {
          return [periodStart, { ...entry, items: existingItems }];
        }
        if (!entry.text) {
          return [periodStart, { ...entry, items: [] }];
        }
        const items = entry.text
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .map(text => ({
            id: generateId(),
            text,
            doneAt: entry.completedAt || null
          }));
        return [periodStart, { ...entry, items }];
      })
    );
  };

  const applyRemoteState = (data) => {
    const merged = { ...defaultState, ...data };
    const normalizedJournals = normalizeJournals(merged.journals);
    const normalizedWeeklyGoals = normalizeGoals(merged.weeklyGoals);
    const normalizedMonthlyGoals = normalizeGoals(merged.monthlyGoals);
    const allowedFocusHabits = new Set([
      'nofap',
      'workout',
      'run',
      'keptWord',
      'hardThing',
      'healthyEating'
    ]);
    const nextFocusHabit = allowedFocusHabits.has(merged.focusHabit)
      ? merged.focusHabit
      : defaultState.focusHabit;
    setMetrics(merged.metrics || {});
    setHabits(merged.habits || {});
    setJournals(normalizedJournals);
    setTransactions(merged.transactions || []);
    setLibrary(merged.library || []);
    setReadingSessions(merged.readingSessions || []);
    setMediaSessions(merged.mediaSessions || []);
    setLearningNotes(merged.learningNotes || []);
    setSrsState(merged.srsState || {});
    setReviews(merged.reviews || {});
    setWeeklyGoals(normalizedWeeklyGoals);
    setMonthlyGoals(normalizedMonthlyGoals);
    setGameSessions(merged.gameSessions || []);
    setGameLimitMinutes(merged.gameLimitMinutes || defaultState.gameLimitMinutes);
    setGoals(merged.goals || defaultState.goals);
    setFocusHabit(nextFocusHabit);
    setOnboardingComplete(Boolean(merged.onboardingComplete));
    setFocusAlertLast(merged.focusAlertLast || '');
    setOnboardingGoals(merged.goals || defaultState.goals);
    setOnboardingFocus(nextFocusHabit);
  };

  useEffect(() => {
    const loadState = async () => {
      if (!user) {
        hasHydratedRef.current = false;
        setIsHydrated(false);
        return;
      }
      setSyncStatus('loading');
      const { data, error } = await supabase
        .from('user_state')
        .select('data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        setSyncStatus('error');
        return;
      }

      if (data?.data) {
        applyRemoteState(data.data);
      } else {
        await supabase.from('user_state').upsert({
          user_id: user.id,
          data: defaultState,
          updated_at: new Date().toISOString()
        });
        applyRemoteState(defaultState);
      }

      hasHydratedRef.current = true;
      setIsHydrated(true);
      setSyncStatus('idle');
    };

    loadState();
  }, [user]);

  const combinedState = useMemo(() => ({
    metrics,
    habits,
    journals: normalizeJournals(journals),
    transactions,
    library,
    readingSessions,
    mediaSessions,
    learningNotes,
    srsState,
    reviews,
    weeklyGoals: normalizeGoals(weeklyGoals),
    monthlyGoals: normalizeGoals(monthlyGoals),
    gameSessions,
    gameLimitMinutes,
    goals,
    focusHabit,
    onboardingComplete,
    focusAlertLast
  }), [
    metrics,
    habits,
    journals,
    transactions,
    library,
    readingSessions,
    mediaSessions,
    learningNotes,
    srsState,
    reviews,
    weeklyGoals,
    monthlyGoals,
    gameSessions,
    gameLimitMinutes,
    goals,
    focusHabit,
    onboardingComplete,
    focusAlertLast
  ]);

  const today = getToday();
  const weekStart = getWeekStart(today);
  const monthStart = getMonthStart(today);
  const currentWeeklyGoal = weeklyGoals?.[weekStart];
  const currentMonthlyGoal = monthlyGoals?.[monthStart];
  const hasWeeklyItems = (currentWeeklyGoal?.items || []).some(item => item?.text);
  const hasMonthlyItems = (currentMonthlyGoal?.items || []).some(item => item?.text);

  useEffect(() => {
    if (!user || !isHydrated) {
      setShowGoalsPrompt(false);
      return;
    }
    const weeklyMissing = !hasWeeklyItems && !currentWeeklyGoal?.dismissedAt;
    const monthlyMissing = !hasMonthlyItems && !currentMonthlyGoal?.dismissedAt;
    if (weeklyMissing || monthlyMissing) {
      const weeklyDraft = hasWeeklyItems
        ? currentWeeklyGoal.items.map(item => item.text).join('\n')
        : (currentWeeklyGoal?.text || '');
      const monthlyDraft = hasMonthlyItems
        ? currentMonthlyGoal.items.map(item => item.text).join('\n')
        : (currentMonthlyGoal?.text || '');
      setWeeklyGoalDraft(weeklyDraft);
      setMonthlyGoalDraft(monthlyDraft);
      setShowGoalsPrompt(true);
    } else {
      setShowGoalsPrompt(false);
    }
  }, [user, isHydrated, currentWeeklyGoal, currentMonthlyGoal, hasWeeklyItems, hasMonthlyItems]);

  useEffect(() => {
    if (!isHydrated) return;
    if (currentWeeklyGoal) return;
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    const legacyWeekStart = formatDate(d);
    if (legacyWeekStart === weekStart) return;
    const legacy = weeklyGoals?.[legacyWeekStart];
    if (!legacy || legacy.dismissedAt) return;
    setWeeklyGoals(prev => ({
      ...prev,
      [weekStart]: legacy
    }));
  }, [isHydrated, today, weekStart, currentWeeklyGoal, weeklyGoals]);

  useEffect(() => {
    if (!user || !hasHydratedRef.current) return;
    setSyncStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      await supabase.from('user_state').upsert({
        user_id: user.id,
        data: combinedState,
        updated_at: new Date().toISOString()
      });
      setSyncStatus('idle');
    }, 800);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [combinedState, user]);

  const primaryNav = [
    { id: 'body', icon: <Icons.Activity />, label: 'Body' },
    { id: 'mind', icon: <Icons.Brain />, label: 'Mind' },
    { id: 'core', icon: <Icons.Flame />, label: 'Core' },
    { id: 'money', icon: <Icons.DollarSign />, label: 'Money' },
    { id: 'review', icon: <Icons.Trophy />, label: 'Review' },
  ];
  const secondaryNav = [
    { id: 'log', icon: <Icons.Calendar />, label: 'Log' },
    { id: 'library', icon: <Icons.Book />, label: 'Library' },
    { id: 'learning', icon: <Icons.Brain />, label: 'Learning' },
    { id: 'journal', icon: <Icons.Edit />, label: 'Journal' },
    { id: 'analytics', icon: <Icons.Chart />, label: 'Analytics' },
    { id: 'settings', icon: <Icons.Settings />, label: 'Settings' },
  ];
  const secondaryNavIds = new Set(secondaryNav.map(item => item.id));
  const secondaryNavMap = useMemo(() => {
    return new Map(secondaryNav.map(item => [item.id, item]));
  }, [secondaryNav]);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    setRecentPages(prev => {
      const next = [page, ...prev.filter(id => id !== page)].slice(0, 5);
      localStorage.setItem('progress_recent_pages', JSON.stringify(next));
      return next;
    });
  }, [page]);

  useEffect(() => {
    if (!showMore) return;
    return () => {};
  }, [showMore]);

  const renderPage = () => {
    const props = {
      metrics, setMetrics,
      habits, setHabits,
      journals, setJournals,
      transactions, setTransactions,
      library, setLibrary,
      readingSessions, setReadingSessions,
      mediaSessions, setMediaSessions,
      learningNotes, setLearningNotes,
      srsState, setSrsState,
      reviews, setReviews,
      weeklyGoals, setWeeklyGoals,
      monthlyGoals, setMonthlyGoals,
      gameSessions, setGameSessions,
      gameLimitMinutes, setGameLimitMinutes,
      goals, setGoals,
      focusHabit, setFocusHabit,
      focusAlertLast, setFocusAlertLast
    };

    switch (page) {
      case 'body': return <BodyPage {...props} />;
      case 'mind': return (
        <MindPage
          {...props}
          journals={journals}
          setJournals={setJournals}
          readingSessions={readingSessions}
          setReadingSessions={setReadingSessions}
          library={library}
          learningNotes={learningNotes}
        />
      );
      case 'core': return <CorePage {...props} />;
      case 'log': return (
        <LogPage
          metrics={metrics}
          setMetrics={setMetrics}
          habits={habits}
          setHabits={setHabits}
          journals={journals}
          setJournals={setJournals}
          readingSessions={readingSessions}
          goals={goals}
        />
      );
      case 'money': return <MoneyPage {...props} />;
      case 'journal': return <JournalPage {...props} />;
      case 'library': return <LibraryPage {...props} />;
      case 'learning': return <LearningPage {...props} journals={journals} />;
      case 'analytics': return <AnalyticsPage {...props} library={library} />;
      case 'review': return (
        <ReviewPage
          metrics={metrics}
          habits={habits}
          transactions={transactions}
          journals={journals}
          goals={goals}
          readingSessions={readingSessions}
          focusHabit={focusHabit}
          reviews={reviews}
          setReviews={setReviews}
        />
      );
      case 'settings': return (
        <SettingsPage
          {...props}
          mediaSessions={mediaSessions}
          setMediaSessions={setMediaSessions}
          setOnboardingComplete={setOnboardingComplete}
          onSignOut={async () => {
            await supabase.auth.signOut();
            setUser(null);
          }}
        />
      );
      default: return <BodyPage {...props} />;
    }
  };

  const handleAuth = async () => {
    setAuthError('');
    if (!authEmail || !authPassword) {
      setAuthError('Email and password are required.');
      return;
    }
    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) {
        setAuthError(error.message);
      }
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) {
      setAuthError(error.message);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <Card className="p-6 w-full max-w-sm">
          <h1 className="text-xl font-bold text-white mb-2">Welcome</h1>
          <p className="text-slate-400 text-sm mb-4">Sign in to sync your progress.</p>
          <div className="space-y-3">
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
            />
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
            />
            {authError && (
              <div className="text-red-400 text-sm">{authError}</div>
            )}
            <Button className="w-full" onClick={handleAuth}>
              {authMode === 'signup' ? 'Create Account' : 'Sign In'}
            </Button>
            <button
              className="text-slate-400 text-sm w-full"
              onClick={() => setAuthMode(prev => prev === 'signup' ? 'signin' : 'signup')}
            >
              {authMode === 'signup' ? 'Have an account? Sign in' : 'New here? Create an account'}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <main className="relative max-w-lg mx-auto px-4 py-6">
        {renderPage()}
      </main>

      <div className="fixed top-3 right-4 text-xs text-slate-500">
        {syncStatus === 'saving' ? 'Saving...' : syncStatus === 'error' ? 'Sync error' : 'Synced'}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 safe-area-pb">
        <div className="max-w-lg mx-auto px-2">
          <div className="flex justify-around py-2">
            {primaryNav.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all ${
                  page === item.id
                    ? 'text-amber-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => setShowMore(prev => !prev)}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all ${
                showMore || secondaryNavIds.has(page)
                  ? 'text-amber-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icons.Chart />
              <span className="text-xs mt-1">More</span>
            </button>
          </div>
        </div>
      </nav>

      {showMore && (
        <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto bg-slate-800 rounded-2xl border border-slate-700 p-4 shadow-2xl z-40">
          <div className="space-y-4">
            <div>
              <div className="text-slate-500 text-xs uppercase tracking-wider mb-2">Recent</div>
              <div className="space-y-2">
                {recentPages.filter(id => secondaryNavIds.has(id)).slice(0, 3).map((id) => {
                  const item = secondaryNavMap.get(id);
                  if (!item) return null;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setPage(item.id);
                        setShowMore(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 text-slate-200 hover:bg-slate-700/70 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <span className="text-xs text-slate-500">Last used</span>
                    </button>
                  );
                })}
                {recentPages.filter(id => secondaryNavIds.has(id)).length === 0 && (
                  <div className="text-slate-500 text-sm">No recent pages yet.</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-slate-500 text-xs uppercase tracking-wider mb-2">Review</div>
              <div className="space-y-2">
                {['review', 'log'].map((id) => {
                  const item = secondaryNavMap.get(id);
                  if (!item) return null;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setPage(item.id);
                        setShowMore(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 text-slate-200 hover:bg-slate-700/70 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {item.id === 'review' ? 'Weekly + monthly' : 'Edit past days'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-slate-500 text-xs uppercase tracking-wider mb-2">Knowledge</div>
              <div className="space-y-2">
                {['library', 'learning', 'journal'].map((id) => {
                  const item = secondaryNavMap.get(id);
                  if (!item) return null;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setPage(item.id);
                        setShowMore(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 text-slate-200 hover:bg-slate-700/70 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {item.id === 'library' ? 'Track media' : item.id === 'learning' ? 'Notes + SRS' : 'Daily writing'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-slate-500 text-xs uppercase tracking-wider mb-2">System</div>
              <div className="space-y-2">
                {['analytics', 'settings'].map((id) => {
                  const item = secondaryNavMap.get(id);
                  if (!item) return null;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setPage(item.id);
                        setShowMore(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 text-slate-200 hover:bg-slate-700/70 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {item.id === 'analytics' ? 'Deep stats' : 'App setup'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showGoalsPrompt}
        onClose={() => {
          const hasWeeklyItems = (currentWeeklyGoal?.items || []).some(item => item?.text);
          const hasMonthlyItems = (currentMonthlyGoal?.items || []).some(item => item?.text);
          if (!hasWeeklyItems && !currentWeeklyGoal?.dismissedAt) {
            setWeeklyGoals(prev => ({
              ...prev,
              [weekStart]: { items: [], dismissedAt: today }
            }));
          }
          if (!hasMonthlyItems && !currentMonthlyGoal?.dismissedAt) {
            setMonthlyGoals(prev => ({
              ...prev,
              [monthStart]: { items: [], dismissedAt: today }
            }));
          }
          setShowGoalsPrompt(false);
        }}
        title="Set Your Weekly/Monthly Goals"
      >
        <div className="space-y-4">
          {!hasWeeklyItems && (
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
          )}
          {!hasMonthlyItems && (
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
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                if (!hasWeeklyItems && !weeklyGoalDraft.trim()) {
                  setWeeklyGoals(prev => ({
                    ...prev,
                    [weekStart]: { items: [], dismissedAt: today }
                  }));
                }
                if (!hasMonthlyItems && !monthlyGoalDraft.trim()) {
                  setMonthlyGoals(prev => ({
                    ...prev,
                    [monthStart]: { items: [], dismissedAt: today }
                  }));
                }
                setShowGoalsPrompt(false);
              }}
            >
              Skip for now
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (!hasWeeklyItems) {
                  if (!weeklyGoalDraft.trim()) return;
                  const items = weeklyGoalDraft
                    .split('\n')
                    .map(line => line.trim())
                    .filter(Boolean)
                    .map(text => ({ id: generateId(), text, doneAt: null }));
                  setWeeklyGoals(prev => ({
                    ...prev,
                    [weekStart]: {
                      items,
                      savedAt: today,
                      completedAt: null,
                      dismissedAt: null
                    }
                  }));
                }
                if (!hasMonthlyItems) {
                  if (!monthlyGoalDraft.trim()) return;
                  const items = monthlyGoalDraft
                    .split('\n')
                    .map(line => line.trim())
                    .filter(Boolean)
                    .map(text => ({ id: generateId(), text, doneAt: null }));
                  setMonthlyGoals(prev => ({
                    ...prev,
                    [monthStart]: {
                      items,
                      savedAt: today,
                      completedAt: null,
                      dismissedAt: null
                    }
                  }));
                }
                setShowGoalsPrompt(false);
              }}
              disabled={
                (!hasWeeklyItems && !weeklyGoalDraft.trim())
                || (!hasMonthlyItems && !monthlyGoalDraft.trim())
              }
            >
              Save Goals
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!onboardingComplete}
        onClose={() => {}}
        title="Quick Setup"
      >
        <div className="space-y-4">
          <div className="text-slate-400 text-sm">
            Set your goals and weekly focus. You can edit these later in Settings.
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-sm mb-2 block">Steps Goal</label>
              <input
                type="number"
                value={onboardingGoals?.steps || 10000}
                onChange={(e) => setOnboardingGoals(prev => ({ ...prev, steps: Number(e.target.value) }))}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-2 block">Water Goal (L)</label>
              <input
                type="number"
                step="0.1"
                value={onboardingGoals?.water || 1.5}
                onChange={(e) => setOnboardingGoals(prev => ({ ...prev, water: Number(e.target.value) }))}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-2 block">Sleep Goal (hours)</label>
              <input
                type="number"
                step="0.5"
                value={onboardingGoals?.sleep || 7.5}
                onChange={(e) => setOnboardingGoals(prev => ({ ...prev, sleep: Number(e.target.value) }))}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-2 block">Pages Goal (daily)</label>
              <input
                type="number"
                value={onboardingGoals?.pages || 20}
                onChange={(e) => setOnboardingGoals(prev => ({ ...prev, pages: Number(e.target.value) }))}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-2 block">Push-ups Goal (daily)</label>
              <input
                type="number"
                value={onboardingGoals?.pushups || 50}
                onChange={(e) => setOnboardingGoals(prev => ({ ...prev, pushups: Number(e.target.value) }))}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-2 block">Weekly Focus Habit</label>
              <select
                value={onboardingFocus}
                onChange={(e) => setOnboardingFocus(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
              >
                {[
                  { value: 'nofap', label: 'NoFap' },
                  { value: 'workout', label: 'Workout' },
                  { value: 'run', label: 'Run' },
                  { value: 'keptWord', label: 'Kept my word' },
                  { value: 'hardThing', label: 'Did a hard thing' },
                  { value: 'healthyEating', label: 'Ate healthy (no sugar)' }
                ].map((habit) => (
                  <option key={habit.value} value={habit.value}>
                    {habit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              setGoals(onboardingGoals);
              setFocusHabit(onboardingFocus);
              setOnboardingComplete(true);
            }}
          >
            Save Setup
          </Button>
        </div>
      </Modal>
    </div>
  );
}
