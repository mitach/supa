import { useState } from 'react';

import { Button } from '../Button';

const ReadingSessionForm = ({ books, onSave }) => {
  const [bookId, setBookId] = useState(books[0]?.id || '');
  const [pages, setPages] = useState('');

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
      <Button
        className="w-full"
        onClick={() => pages && bookId && onSave({ bookId, pages: Number(pages) })}
        disabled={!pages || !bookId}
      >
        Save Session
      </Button>
    </div>
  );
};

export { ReadingSessionForm };
