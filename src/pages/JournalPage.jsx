import { useEffect, useState } from 'react';

import { Card } from '../components';
import { getToday } from '../utils';

const JournalPage = ({ journals, setJournals }) => {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [text, setText] = useState(journals[selectedDate]?.text || '');

  useEffect(() => {
    setText(journals[selectedDate]?.text || '');
  }, [selectedDate, journals]);

  const saveJournal = () => {
    setJournals(prev => ({
      ...prev,
      [selectedDate]: { ...prev[selectedDate], text }
    }));
  };

  useEffect(() => {
    const timeout = setTimeout(saveJournal, 500);
    return () => clearTimeout(timeout);
  }, [text]);

  const journalDates = Object.keys(journals).filter(d => journals[d]?.text).sort().reverse();

  return (
    <div className="space-y-6 pb-24">
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold text-white mb-1">Journal</h1>
        <p className="text-slate-400 text-sm">Free writing and reflection</p>
      </div>

      <Card className="p-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4 focus:outline-none focus:border-amber-500/50"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind today?"
          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
          rows={10}
        />
        <div className="text-right text-slate-500 text-sm mt-2">
          {text.split(/\s+/).filter(Boolean).length} words
        </div>
      </Card>

      {journalDates.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Past Entries</h2>
          {journalDates.slice(0, 10).map((date) => (
            <Card
              key={date}
              className="p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
              onClick={() => setSelectedDate(date)}
            >
              <div className="text-amber-400 text-sm mb-2">
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              <p className="text-slate-300 line-clamp-2">
                {journals[date].text}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JournalPage;
