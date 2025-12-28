import { useMemo, useState } from 'react';

import { Button, Card, Icons, LearningNoteForm, Modal } from '../components';
import { calculateNextReview, formatDate, generateId, getToday } from '../utils';

const LearningPage = ({ learningNotes, setLearningNotes, srsState, setSrsState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);

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

      {dueNotes.length > 0 && (
        <Card
          className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20 cursor-pointer"
          onClick={() => setReviewMode(true)}
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

      <div className="space-y-3">
        {learningNotes.map((note) => {
          const state = srsState[note.id];
          return (
            <Card
              key={note.id}
              className="p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
              onClick={() => setEditNote(note)}
            >
              <h3 className="font-semibold text-white mb-1">{note.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-2">{note.body}</p>
              {state && (
                <div className="text-xs text-slate-500 mt-2">
                  Next review: {state.nextReviewAt}
                </div>
              )}
            </Card>
          );
        })}

        {learningNotes.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No learning notes yet. Add your first one!
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
