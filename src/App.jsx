import { useEffect, useMemo, useRef, useState } from 'react';

import { Button, Card, Icons, Modal } from './components';
import AnalyticsPage from './pages/AnalyticsPage';
import JournalPage from './pages/JournalPage';
import LearningPage from './pages/LearningPage';
import LibraryPage from './pages/LibraryPage';
import LogPage from './pages/LogPage';
import MoneyPage from './pages/MoneyPage';
import ReviewPage from './pages/ReviewPage';
import SettingsPage from './pages/SettingsPage';
import TodayPage from './pages/TodayPage';
import { supabase } from './lib/supabaseClient';

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
    goals: { steps: 10000, water: 1.5, sleep: 7.5, pages: 20, pushups: 50 },
    focusHabit: 'workout',
    onboardingComplete: false,
    focusAlertLast: ''
  };

export default function App() {
  const [page, setPage] = useState('today');

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

  const applyRemoteState = (data) => {
    const merged = { ...defaultState, ...data };
    const normalizedJournals = normalizeJournals(merged.journals);
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
    goals,
    focusHabit,
    onboardingComplete,
    focusAlertLast
  ]);

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

  const navItems = [
    { id: 'today', icon: <Icons.Home />, label: 'Today' },
    { id: 'log', icon: <Icons.Calendar />, label: 'Log' },
    { id: 'money', icon: <Icons.DollarSign />, label: 'Money' },
    { id: 'library', icon: <Icons.Book />, label: 'Library' },
    { id: 'learning', icon: <Icons.Brain />, label: 'Learn' },
    { id: 'journal', icon: <Icons.Edit />, label: 'Journal' },
    { id: 'analytics', icon: <Icons.Chart />, label: 'Stats' },
    { id: 'review', icon: <Icons.Trophy />, label: 'Review' },
    { id: 'settings', icon: <Icons.Settings />, label: 'Settings' },
  ];

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
      goals, setGoals,
      focusHabit, setFocusHabit,
      focusAlertLast, setFocusAlertLast
    };

    switch (page) {
      case 'today': return <TodayPage {...props} />;
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
      default: return <TodayPage {...props} />;
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
            {navItems.slice(0, 5).map((item) => (
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
              onClick={() => setPage(prevPage =>
                ['journal', 'analytics', 'review', 'settings'].includes(prevPage) ? prevPage : 'analytics'
              )}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all ${
                ['journal', 'analytics', 'review', 'settings'].includes(page)
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

      {['journal', 'analytics', 'review', 'settings'].includes(page) && (
        <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto bg-slate-800 rounded-2xl border border-slate-700 p-2 shadow-2xl z-40">
          <div className="grid grid-cols-4 gap-2">
            {navItems.slice(5).map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex flex-col items-center py-3 px-4 rounded-xl transition-all ${
                  page === item.id
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-slate-400 hover:bg-slate-700'
                }`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
