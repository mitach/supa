import { useMemo, useState } from 'react';

import { Button, Card, Icons, LearningNoteForm, Modal } from '../components';
import { calculateNextReview, formatDate, generateId, getToday } from '../utils';

const REVIEW_GOAL = 10;

const LearningPage = ({ learningNotes, setLearningNotes, srsState, setSrsState, journals }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEdit, setInlineEdit] = useState({ title: '', body: '', tags: '', source: '' });

  const today = getToday();

  const dueNotes = useMemo(() => {
    return learningNotes.filter(note => {
      const state = srsState[note.id];
      if (!state) return true;
      return state.nextReviewAt <= today;
    });
  }, [learningNotes, srsState, today]);

  const handleReview = (noteId, response) => {
    const currentState = srsState[noteId] || { interval: 1, ease: 2.5 };
    const { interval, ease } = calculateNextReview(currentState.interval, currentState.ease, response);

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);

    setSrsState(prev => ({
      ...prev,
      [noteId]: {
        interval,
        ease,
        nextReviewAt: formatDate(nextDate),
        lastReviewedAt: today
      }
    }));
  };

  const allTags = useMemo(() => {
    const tags = new Set();
    learningNotes.forEach(note => {
      if (!note.tags) return;
      note.tags.split(',').forEach(tag => {
        const trimmed = tag.trim();
        if (trimmed) tags.add(trimmed);
      });
    });
    return Array.from(tags);
  }, [learningNotes]);

  const filteredNotes = useMemo(() => {
    return learningNotes.filter(note => {
      const matchesTag = tagFilter === 'all'
        ? true
        : note.tags?.split(',').map(t => t.trim()).includes(tagFilter);
      const haystack = `${note.title} ${note.body} ${note.tags || ''}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      return matchesTag && matchesSearch;
    });
  }, [learningNotes, tagFilter, search]);

  const startReview = () => {
    setReviewTotal(dueNotes.length);
    setReviewMode(true);
  };

  const reviewedCount = reviewTotal > 0 ? reviewTotal - dueNotes.length : 0;
  const reviewProgress = reviewTotal > 0 ? Math.round((reviewedCount / reviewTotal) * 100) : 0;

  if (reviewMode && dueNotes.length > 0) {
    const currentNote = dueNotes[0];
    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setReviewMode(false)} className="text-slate-400">
            <Icons.ArrowLeft />
          </button>
          <span className="text-slate-400 text-sm">{dueNotes.length} cards remaining</span>
        </div>

        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Review Progress</span>
            <span>{reviewedCount}/{reviewTotal}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${reviewProgress}%` }}
            />
          </div>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">{currentNote.title}</h2>
          <p className="text-slate-300 whitespace-pre-wrap">{currentNote.body}</p>
          {currentNote.tags && (
            <div className="flex flex-wrap gap-2 mt-4">
              {currentNote.tags.split(',').map((tag, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-4 gap-2">
          {['again', 'hard', 'good', 'easy'].map((response) => (
            <Button
              key={response}
              variant={response === 'again' ? 'danger' : 'secondary'}
              onClick={() => handleReview(currentNote.id, response)}
              className="capitalize"
            >
              {response}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Learning</h1>
          <p className="text-slate-400 text-sm">{learningNotes.length} notes</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Icons.Plus />
        </Button>
      </div>

      {reviewMode && dueNotes.length === 0 && reviewTotal > 0 && (
        <Card className="p-6 text-center">
          <div className="text-emerald-400 font-semibold text-lg">Review complete</div>
          <div className="text-slate-400 text-sm mt-1">You cleared {reviewTotal} cards.</div>
          <Button className="w-full mt-4" onClick={() => setReviewMode(false)}>
            Back to Notes
          </Button>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-sm">Due Today</div>
            <div className="text-2xl font-bold text-white">{dueNotes.length}</div>
          </div>
          <div className="text-right text-slate-500 text-sm">
            Goal: {REVIEW_GOAL} cards
          </div>
        </div>
      </Card>

      {dueNotes.length > 0 && (
        <Card
          className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20 cursor-pointer"
          onClick={startReview}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
                <Icons.Brain />
              </div>
              <div>
                <div className="text-white font-semibold">{dueNotes.length} cards to review</div>
                <div className="text-slate-400 text-sm">Tap to start session</div>
              </div>
            </div>
            <Icons.RefreshCw />
          </div>
        </Card>
      )}

      {journals?.[today]?.til && (
        <Card className="p-4">
          <div className="text-slate-400 text-sm mb-2">From Today</div>
          <div className="text-slate-300 text-sm mb-3 line-clamp-2">
            {journals[today].til}
          </div>
          <Button
            className="w-full"
            onClick={() => {
              const text = journals[today].til;
              const title = text.length > 60 ? `${text.slice(0, 60)}...` : text;
              setLearningNotes(prev => [...prev, { id: generateId(), title, body: text, tags: '', source: '', quality: {} }]);
            }}
          >
            Add to Learning
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setTagFilter('all')}
            className={`px-3 py-1 rounded-full text-xs ${
              tagFilter === 'all' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className={`px-3 py-1 rounded-full text-xs ${
                tagFilter === tag ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotes.map((note) => {
          const state = srsState[note.id];
          return (
            <Card
              key={note.id}
              className="p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
            >
              {inlineEditId === note.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={inlineEdit.title}
                    onChange={(e) => setInlineEdit(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500/50"
                  />
                  <textarea
                    value={inlineEdit.body}
                    onChange={(e) => setInlineEdit(prev => ({ ...prev, body: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white resize-none focus:outline-none focus:border-amber-500/50"
                    rows={4}
                  />
                  <input
                    type="text"
                    value={inlineEdit.tags}
                    onChange={(e) => setInlineEdit(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500/50"
                    placeholder="tags"
                  />
                  <input
                    type="text"
                    value={inlineEdit.source}
                    onChange={(e) => setInlineEdit(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500/50"
                    placeholder="source"
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setLearningNotes(prev => prev.map(n => n.id === note.id ? { ...n, ...inlineEdit } : n));
                        setInlineEditId(null);
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setInlineEditId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white mb-1">{note.title}</h3>
                    <div className="flex gap-2">
                      <button
                        className="text-xs text-slate-400 hover:text-white"
                        onClick={() => {
                          setInlineEditId(note.id);
                          setInlineEdit({
                            title: note.title,
                            body: note.body,
                            tags: note.tags || '',
                            source: note.source || ''
                          });
                        }}
                      >
                        Quick edit
                      </button>
                      <button
                        className="text-xs text-slate-400 hover:text-white"
                        onClick={() => setEditNote(note)}
                      >
                        Open
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-2">{note.body}</p>
                  {note.tags && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {note.tags.split(',').map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  {state && (
                    <div className="text-xs text-slate-500 mt-2">
                      Next review: {state.nextReviewAt} | Ease {state.ease?.toFixed(2) || 2.5} | Interval {state.interval || 1}d
                    </div>
                  )}
                </>
              )}
            </Card>
          );
        })}

        {filteredNotes.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No learning notes match your filters.
          </div>
        )}
      </div>

      <Modal
        isOpen={showAdd || !!editNote}
        onClose={() => { setShowAdd(false); setEditNote(null); }}
        title={editNote ? 'Edit Note' : 'Add Learning Note'}
      >
        <LearningNoteForm
          initial={editNote}
          onSave={(note) => {
            if (editNote) {
              setLearningNotes(prev => prev.map(n => n.id === editNote.id ? { ...n, ...note } : n));
            } else {
              setLearningNotes(prev => [...prev, { ...note, id: generateId() }]);
            }
            setShowAdd(false);
            setEditNote(null);
          }}
          onDelete={editNote ? () => {
            setLearningNotes(prev => prev.filter(n => n.id !== editNote.id));
            setEditNote(null);
          } : undefined}
        />
      </Modal>
    </div>
  );
};

export default LearningPage;
