import { useState } from 'react';

import { Button } from '../Button';

const LibraryForm = ({ initial, onSave, onDelete }) => {
  const [type, setType] = useState(initial?.type || 'book');
  const [title, setTitle] = useState(initial?.title || '');
  const [status, setStatus] = useState(initial?.status || 'planned');
  const [rating, setRating] = useState(initial?.rating || 0);
  const [tags, setTags] = useState(initial?.tags || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [link, setLink] = useState(initial?.link || '');
  const [startedAt, setStartedAt] = useState(initial?.startedAt || '');
  const [durationMinutes, setDurationMinutes] = useState(initial?.durationMinutes || '');
  const [progressTotal, setProgressTotal] = useState(initial?.progressTotal || '');
  const [progressCompleted, setProgressCompleted] = useState(initial?.progressCompleted || '');

  const types = ['book', 'movie', 'series', 'article', 'course', 'podcast'];
  const statuses = ['planned', 'in_progress', 'finished'];
  const progressConfig = {
    series: { totalLabel: 'Total episodes', completedLabel: 'Episodes watched', unit: 'eps' },
    course: { totalLabel: 'Total hours', completedLabel: 'Hours completed', unit: 'h' },
  };
  const showProgress = type === 'series' || type === 'course';
  const progressLabels = progressConfig[type];

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

      {(type === 'series' || type === 'course') && (
        <div>
          <label className="text-slate-400 text-sm mb-2 block">Started At (optional)</label>
          <input
            type="date"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
      )}

      {type === 'movie' && (
        <div>
          <label className="text-slate-400 text-sm mb-2 block">Duration (minutes)</label>
          <input
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="0"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
      )}

      <div>
        <label className="text-slate-400 text-sm mb-2 block">Link (optional)</label>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {showProgress && (
        <div className="space-y-3">
          <label className="text-slate-400 text-sm mb-1 block">Progress</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-500 text-xs mb-2 block">{progressLabels.totalLabel}</label>
              <input
                type="number"
                value={progressTotal}
                onChange={(e) => setProgressTotal(e.target.value)}
                placeholder={`0 ${progressLabels.unit}`}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
            {type === 'course' && (
              <div>
                <label className="text-slate-500 text-xs mb-2 block">{progressLabels.completedLabel}</label>
                <input
                  type="number"
                  value={progressCompleted}
                  onChange={(e) => setProgressCompleted(e.target.value)}
                  placeholder={`0 ${progressLabels.unit}`}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
            )}
          </div>
          {type === 'series' && (
            <div className="text-xs text-slate-500">
              Episodes watched are tracked per session.
            </div>
          )}
        </div>
      )}

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
          onClick={() => title && onSave({
            type,
            title,
            status,
            rating,
            tags,
            notes,
            link: link || '',
            startedAt: startedAt || '',
            durationMinutes: durationMinutes === '' ? null : Number(durationMinutes),
            progressTotal: progressTotal === '' ? null : Number(progressTotal),
            progressCompleted: type === 'course'
              ? (progressCompleted === '' ? null : Number(progressCompleted))
              : null
          })}
          disabled={!title}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export { LibraryForm };
