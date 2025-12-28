import { useState } from 'react';

import { Button } from '../Button';

const LibraryForm = ({ initial, onSave, onDelete }) => {
  const [type, setType] = useState(initial?.type || 'book');
  const [title, setTitle] = useState(initial?.title || '');
  const [status, setStatus] = useState(initial?.status || 'planned');
  const [rating, setRating] = useState(initial?.rating || 0);
  const [tags, setTags] = useState(initial?.tags || '');
  const [notes, setNotes] = useState(initial?.notes || '');

  const types = ['book', 'movie', 'series', 'article', 'course', 'podcast'];
  const statuses = ['planned', 'in_progress', 'finished'];

  return (
    <div className="space-y-4">
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Type</label>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${
                type === t
                  ? 'bg-amber-500 text-slate-900 font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-slate-400 text-sm mb-2 block">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
        />
      </div>

      <div>
        <label className="text-slate-400 text-sm mb-2 block">Status</label>
        <div className="flex gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm capitalize transition-all ${
                status === s
                  ? 'bg-amber-500 text-slate-900 font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-slate-400 text-sm mb-2 block">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setRating(rating === r ? 0 : r)}
              className={`text-2xl transition-all ${
                r <= rating ? 'text-amber-400' : 'text-slate-600'
              }`}
            >
              *
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-slate-400 text-sm mb-2 block">Tags</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="fiction, self-help, sci-fi..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
        />
      </div>

      <div>
        <label className="text-slate-400 text-sm mb-2 block">Notes / Takeaways</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Your thoughts..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
          rows={4}
        />
      </div>

      <div className="flex gap-3">
        {onDelete && (
          <Button variant="danger" onClick={onDelete} className="flex-1">
            Delete
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={() => title && onSave({ type, title, status, rating, tags, notes })}
          disabled={!title}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export { LibraryForm };
