import { useState } from 'react';

import { Button } from '../Button';

const ReadingSessionForm = ({ books, onSave }) => {
  const [bookId, setBookId] = useState(books[0]?.id || '');
  const [pages, setPages] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Book</label>
        {books.length > 0 ? (
          <select
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
          >
            {books.map((book) => (
              <option key={book.id} value={book.id}>{book.title}</option>
            ))}
          </select>
        ) : (
          <p className="text-slate-500 text-sm">No books in progress. Add one in Library first.</p>
        )}
      </div>
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Pages Read</label>
        <input
          type="number"
          value={pages}
          onChange={(e) => setPages(e.target.value)}
          placeholder="0"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-2xl font-bold focus:outline-none focus:border-amber-500/50"
        />
      </div>
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Session Duration (optional)</label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Hours"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
          />
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="Minutes"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>
      <Button
        className="w-full"
        onClick={() => {
          if (!pages || !bookId) return;
          const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
          onSave({ bookId, pages: Number(pages), durationMinutes: totalMinutes || undefined });
        }}
        disabled={!pages || !bookId}
      >
        Save Session
      </Button>
    </div>
  );
};

export { ReadingSessionForm };
