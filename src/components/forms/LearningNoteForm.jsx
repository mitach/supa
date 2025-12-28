import { useState } from 'react';

import { Button } from '../Button';

const LearningNoteForm = ({ initial, onSave, onDelete }) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [body, setBody] = useState(initial?.body || '');
  const [tags, setTags] = useState(initial?.tags || '');
  const [source, setSource] = useState(initial?.source || '');
  const [qualityExample, setQualityExample] = useState(!!initial?.quality?.example);
  const [qualityMnemonic, setQualityMnemonic] = useState(!!initial?.quality?.mnemonic);
  const [qualityQuestion, setQualityQuestion] = useState(!!initial?.quality?.question);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Title / Question</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What did you learn?"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
        />
      </div>

      <div>
        <label className="text-slate-400 text-sm mb-2 block">Content / Answer</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Explain the concept..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50"
          rows={6}
        />
      </div>

      <div>
        <label className="text-slate-400 text-sm mb-2 block">Tags</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="programming, psychology, health..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
        />
      </div>

      <div>
        <label className="text-slate-400 text-sm mb-2 block">Source (optional)</label>
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Book, course, article..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
        />
      </div>

      <div>
        <label className="text-slate-400 text-sm mb-2 block">Quality prompts (optional)</label>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setQualityExample(prev => !prev)}
            className={`px-3 py-2 rounded-lg border ${
              qualityExample ? 'border-emerald-400 text-emerald-300' : 'border-slate-700 text-slate-400'
            }`}
          >
            Example
          </button>
          <button
            type="button"
            onClick={() => setQualityMnemonic(prev => !prev)}
            className={`px-3 py-2 rounded-lg border ${
              qualityMnemonic ? 'border-emerald-400 text-emerald-300' : 'border-slate-700 text-slate-400'
            }`}
          >
            Mnemonic
          </button>
          <button
            type="button"
            onClick={() => setQualityQuestion(prev => !prev)}
            className={`px-3 py-2 rounded-lg border ${
              qualityQuestion ? 'border-emerald-400 text-emerald-300' : 'border-slate-700 text-slate-400'
            }`}
          >
            Question
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        {onDelete && (
          <Button variant="danger" onClick={onDelete} className="flex-1">
            Delete
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={() => title && body && onSave({
            title,
            body,
            tags,
            source,
            quality: {
              example: qualityExample,
              mnemonic: qualityMnemonic,
              question: qualityQuestion
            }
          })}
          disabled={!title || !body}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export { LearningNoteForm };
