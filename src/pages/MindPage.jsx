import { useEffect, useMemo, useState } from 'react';

import { Button, Card, Icons, MetricInput, Modal, ReadingSessionForm } from '../components';
import { generateId, getDaysAgo, getToday } from '../utils';

const MindPage = ({
  metrics,
  setMetrics,
  journals,
  setJournals,
  readingSessions,
  setReadingSessions,
  library,
  learningNotes
}) => {
  const today = getToday();
  const todayMetrics = metrics[today] || {};
  const todayJournal = journals[today] || {};

  const [pagesView, setPagesView] = useState('total');
  const [journalText, setJournalText] = useState(todayJournal.text || '');
  const [tilText, setTilText] = useState(todayJournal.til || '');
  const [importantText, setImportantText] = useState(todayJournal.important || '');
  const [showReadingAdd, setShowReadingAdd] = useState(false);
  const [historyDate, setHistoryDate] = useState(today);

  const updateMetric = (key, value) => {
    setMetrics(prev => ({
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

  const todaySessions = readingSessions.filter(s => s.date === today);
  const todayPagesSessions = todaySessions.reduce((sum, s) => sum + s.pages, 0);
  const todaySessionMinutes = todaySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const todayPagesTotal = (todayMetrics.pages || 0) + todayPagesSessions;

  const weekStats = useMemo(() => {
    let pagesTotal = 0;
    let sessionMinutes = 0;
    let journalDays = 0;
    let sessionCount = 0;

    for (let i = 0; i < 7; i++) {
      const date = getDaysAgo(i);
      const dayMetrics = metrics[date] || {};
      const daySessions = readingSessions.filter(s => s.date === date);
      const dayJournal = journals[date] || {};
      const sessionPages = daySessions.reduce((sum, s) => sum + s.pages, 0);

      pagesTotal += (dayMetrics.pages || 0) + sessionPages;
      sessionMinutes += daySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      sessionCount += daySessions.length;

      if (dayJournal.text || dayJournal.til || dayJournal.important) {
        journalDays++;
      }
    }

    return {
      pagesTotal,
      sessionMinutes,
      sessionCount,
      journalDays
    };
  }, [metrics, journals, readingSessions]);

  const historyDates = useMemo(() => {
    const year = new Date().getFullYear();
    return Array.from({ length: 14 }, (_, i) => getDaysAgo(i))
      .filter((date) => new Date(date).getFullYear() === year);
  }, []);
  const historyMetrics = metrics[historyDate] || {};
  const historyJournal = journals[historyDate] || {};
  const historySessions = readingSessions.filter(s => s.date === historyDate);
  const historySessionPages = historySessions.reduce((sum, s) => sum + s.pages, 0);
  const historySessionMinutes = historySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const historyPagesTotal = (historyMetrics.pages || 0) + historySessionPages;

  const normalizeStatus = (status) => {
    if (!status) return '';
    return status.toString().toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');
  };
  const bookItems = library.filter(i => i.type === 'book');
  const inProgressBooks = bookItems.filter(i => normalizeStatus(i.status) === 'in_progress');
  const plannedBooks = bookItems.filter(i => normalizeStatus(i.status) === 'planned' || !i.status);
  const sessionBooks = inProgressBooks.length > 0 ? inProgressBooks : plannedBooks;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-start justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Mind</h1>
          <p className="text-slate-400 text-sm">Reading, learning, reflection</p>
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
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Reading</h3>
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
          <Button variant="secondary" onClick={() => setShowReadingAdd(true)}>
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

      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Reflection</h3>
        <div>
          <label className="text-slate-400 text-sm mb-2 block">Journal</label>
          <textarea
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            placeholder="What happened today?"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
            rows={3}
          />
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-2 block">Today I Learned</label>
          <textarea
            value={tilText}
            onChange={(e) => setTilText(e.target.value)}
            placeholder="What did you learn?"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
            rows={2}
          />
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-2 block">Something important happened today</label>
          <textarea
            value={importantText}
            onChange={(e) => setImportantText(e.target.value)}
            placeholder="What happened?"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
            rows={2}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'learning' }))}
          >
            <span className="flex items-center justify-center gap-2">
              <Icons.Brain /> Learning
            </span>
          </Button>
          <Button
            variant="ghost"
            className="border border-slate-700"
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'journal' }))}
          >
            <span className="flex items-center justify-center gap-2">
              <Icons.Edit /> Journal
            </span>
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-3">7-day Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{weekStats.pagesTotal}</div>
            <div className="text-slate-500 text-xs">Pages Read</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sky-400">
              {(weekStats.sessionMinutes / 60).toFixed(1)}h
            </div>
            <div className="text-slate-500 text-xs">Reading Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{weekStats.journalDays}</div>
            <div className="text-slate-500 text-xs">Journal Days</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-violet-400">{learningNotes.length}</div>
            <div className="text-slate-500 text-xs">Learning Notes</div>
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
            <span className="text-slate-300">Pages</span>
            <span className="text-white">{historyPagesTotal || 'n/a'}</span>
          </div>
          <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2">
            <span className="text-slate-300">Read Time</span>
            <span className="text-sky-400">{(historySessionMinutes / 60).toFixed(1)}h</span>
          </div>
          <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2">
            <span className="text-slate-300">Sessions</span>
            <span className="text-white">{historySessions.length}</span>
          </div>
          <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2">
            <span className="text-slate-300">Journal</span>
            <span className={historyJournal.text ? 'text-emerald-400' : 'text-slate-600'}>
              {historyJournal.text ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2">
            <span className="text-slate-300">Learned</span>
            <span className={historyJournal.til ? 'text-emerald-400' : 'text-slate-600'}>
              {historyJournal.til ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2">
            <span className="text-slate-300">Important</span>
            <span className={historyJournal.important ? 'text-emerald-400' : 'text-slate-600'}>
              {historyJournal.important ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showReadingAdd}
        onClose={() => setShowReadingAdd(false)}
        title="Add Reading Session"
      >
        <ReadingSessionForm
          books={sessionBooks}
          onSave={(s) => {
            setReadingSessions(prev => [...prev, { ...s, id: generateId(), date: today }]);
            setShowReadingAdd(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default MindPage;
