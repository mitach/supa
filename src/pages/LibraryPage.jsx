import { useState } from 'react';

import { Button, Card, Icons, LibraryForm, Modal } from '../components';
import { generateId } from '../utils';

const LibraryPage = ({ library, setLibrary, readingSessions }) => {
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const types = ['all', 'book', 'movie', 'series', 'article', 'course', 'podcast'];

  const filteredItems = library.filter(item =>
    filter === 'all' || item.type === filter
  );

  const getItemPages = (itemId) => {
    return readingSessions
      .filter(s => s.bookId === itemId)
      .reduce((sum, s) => sum + s.pages, 0);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Library</h1>
          <p className="text-slate-400 text-sm">{library.length} items</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Icons.Plus />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm capitalize transition-all ${
              filter === type
                ? 'bg-amber-500 text-slate-900 font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className="p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
            onClick={() => setEditItem(item)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 capitalize">
                    {item.type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === 'finished'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : item.status === 'in_progress'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-600 text-slate-400'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                {item.type === 'book' && (
                  <p className="text-slate-500 text-sm">
                    {getItemPages(item.id)} pages read
                  </p>
                )}
                {item.rating && (
                  <div className="text-amber-400 text-sm mt-1">
                    {'*'.repeat(item.rating)}{'.'.repeat(5 - item.rating)}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No items in library. Add your first one!
          </div>
        )}
      </div>

      <Modal
        isOpen={showAdd || !!editItem}
        onClose={() => { setShowAdd(false); setEditItem(null); }}
        title={editItem ? 'Edit Item' : 'Add to Library'}
      >
        <LibraryForm
          initial={editItem}
          onSave={(item) => {
            if (editItem) {
              setLibrary(prev => prev.map(i => i.id === editItem.id ? { ...i, ...item } : i));
            } else {
              setLibrary(prev => [...prev, { ...item, id: generateId() }]);
            }
            setShowAdd(false);
            setEditItem(null);
          }}
          onDelete={editItem ? () => {
            setLibrary(prev => prev.filter(i => i.id !== editItem.id));
            setEditItem(null);
          } : undefined}
        />
      </Modal>
    </div>
  );
};

export default LibraryPage;
