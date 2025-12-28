import { useEffect, useState } from 'react';

import { Icons } from './components';
import { usePersistedState } from './hooks/usePersistedState';
import AnalyticsPage from './pages/AnalyticsPage';
import JournalPage from './pages/JournalPage';
import LearningPage from './pages/LearningPage';
import LibraryPage from './pages/LibraryPage';
import LogPage from './pages/LogPage';
import MoneyPage from './pages/MoneyPage';
import ReviewPage from './pages/ReviewPage';
import SettingsPage from './pages/SettingsPage';
import TodayPage from './pages/TodayPage';
import { STORAGE_KEYS } from './storage';

export default function App() {
  const [page, setPage] = useState('today');

  useEffect(() => {
    const handleNavigate = (e) => setPage(e.detail);
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  const [metrics, setMetrics] = usePersistedState(STORAGE_KEYS.metrics, {});
  const [habits, setHabits] = usePersistedState(STORAGE_KEYS.habits, {});
  const [journals, setJournals] = usePersistedState(STORAGE_KEYS.journals, {});
  const [transactions, setTransactions] = usePersistedState(STORAGE_KEYS.transactions, []);
  const [library, setLibrary] = usePersistedState(STORAGE_KEYS.library, []);
  const [readingSessions, setReadingSessions] = usePersistedState(STORAGE_KEYS.readingSessions, []);
  const [learningNotes, setLearningNotes] = usePersistedState(STORAGE_KEYS.learningNotes, []);
  const [srsState, setSrsState] = usePersistedState(STORAGE_KEYS.srsState, {});
  const [goals, setGoals] = usePersistedState(
    STORAGE_KEYS.goals,
    { steps: 10000, water: 1.5, sleep: 7.5, pages: 20, pushups: 50 }
  );

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
      learningNotes, setLearningNotes,
      srsState, setSrsState,
      goals, setGoals
    };

    switch (page) {
      case 'today': return <TodayPage {...props} />;
      case 'log': return <LogPage metrics={metrics} habits={habits} journals={journals} setJournals={setJournals} goals={goals} />;
      case 'money': return <MoneyPage {...props} />;
      case 'journal': return <JournalPage {...props} />;
      case 'library': return <LibraryPage {...props} />;
      case 'learning': return <LearningPage {...props} />;
      case 'analytics': return <AnalyticsPage {...props} />;
      case 'review': return <ReviewPage metrics={metrics} habits={habits} transactions={transactions} journals={journals} goals={goals} />;
      case 'settings': return <SettingsPage {...props} />;
      default: return <TodayPage {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <main className="relative max-w-lg mx-auto px-4 py-6">
        {renderPage()}
      </main>

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
    </div>
  );
}
