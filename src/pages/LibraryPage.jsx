import { useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

import { Button, Card, Icons, LibraryForm, Modal } from '../components';
import { formatDate, generateId, getToday } from '../utils';

const LibraryPage = ({ library, setLibrary, readingSessions, setReadingSessions }) => {
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editSession, setEditSession] = useState(null);
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionFilter, setSessionFilter] = useState('latest10');
  const [newSession, setNewSession] = useState({
    date: getToday(),
    pages: '',
    hours: '',
    minutes: ''
  });

  const types = ['all', 'book', 'movie', 'series', 'article', 'course', 'podcast'];

  const filteredItems = library.filter(item =>
    filter === 'all' || item.type === filter
  );

  const getItemPages = (itemId) => {
    return readingSessions
      .filter(s => s.bookId === itemId)
      .reduce((sum, s) => sum + s.pages, 0);
  };
  const getItemDurationMinutes = (itemId) => {
    return readingSessions
      .filter(s => s.bookId === itemId)
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  };
  const formatDuration = (totalMinutes) => {
    if (!totalMinutes) return '';
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs && mins) return `${hrs}h ${mins}m`;
    if (hrs) return `${hrs}h`;
    return `${mins}m`;
  };
  const getWeeklyReadingData = (itemId) => {
    const weeks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 7; i >= 0; i--) {
      const start = new Date(today);
      start.setDate(today.getDate() - (today.getDay() + 7 * i));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const weekSessions = readingSessions.filter(s =>
        s.bookId === itemId && s.date >= formatDate(start) && s.date <= formatDate(end)
      );
      const pages = weekSessions.reduce((sum, s) => sum + s.pages, 0);
      const minutes = weekSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      weeks.push({
        label: `${start.getMonth() + 1}/${start.getDate()}`,
        pages,
        hours: Number((minutes / 60).toFixed(1))
      });
    }
    return weeks;
  };
  const openEditSession = (session) => {
    const hours = session.durationMinutes ? Math.floor(session.durationMinutes / 60) : 0;
    const minutes = session.durationMinutes ? session.durationMinutes % 60 : 0;
    setEditSession({
      ...session,
      hours: hours ? String(hours) : '',
      minutes: minutes ? String(minutes) : ''
    });
  };
  const openAddSession = () => {
    setNewSession({
      date: getToday(),
      pages: '',
      hours: '',
      minutes: ''
    });
    setShowAddSession(true);
  };
  const getFilteredSessions = (itemId) => {
    const allSessions = readingSessions
      .filter(s => s.bookId === itemId)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (sessionFilter === 'latest10') return allSessions.slice(0, 10);
    if (sessionFilter === 'month') {
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return allSessions.filter(s => s.date.startsWith(monthStr));
    }
    return allSessions;
  };
  const saveNewSession = () => {
    if (!editItem || !newSession.pages) return;
    const totalMinutes = (Number(newSession.hours) || 0) * 60 + (Number(newSession.minutes) || 0);
    setReadingSessions(prev => [
      ...prev,
      {
        id: generateId(),
        bookId: editItem.id,
        date: newSession.date,
        pages: Number(newSession.pages),
        durationMinutes: totalMinutes || undefined
      }
    ]);
    setShowAddSession(false);
  };
  const updateSession = () => {
    if (!editSession) return;
    const totalMinutes = (Number(editSession.hours) || 0) * 60 + (Number(editSession.minutes) || 0);
    setReadingSessions(prev => prev.map(s =>
      s.id === editSession.id
        ? {
            ...s,
            date: editSession.date,
            pages: Number(editSession.pages),
            durationMinutes: totalMinutes || undefined
          }
        : s
    ));
    setEditSession(null);
  };
  const deleteSession = (id) => {
    setReadingSessions(prev => prev.filter(s => s.id !== id));
    setEditSession(null);
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
                    {getItemDurationMinutes(item.id) > 0 && (
                      <span> • {formatDuration(getItemDurationMinutes(item.id))}</span>
                    )}
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
        {editItem?.type === 'book' && (
          <Card className="p-4 mt-4 bg-slate-800/30">
            <div className="flex items-center justify-between mb-3">
              <div className="text-slate-400 text-sm">Reading Summary</div>
              <div className="flex items-center gap-3">
                <div className="text-slate-500 text-xs">
                  {getItemPages(editItem.id)} pages
                  {getItemDurationMinutes(editItem.id) > 0 && (
                    <span> • {formatDuration(getItemDurationMinutes(editItem.id))}</span>
                  )}
                </div>
                <button
                  className="text-xs text-amber-300 hover:text-amber-200"
                  onClick={openAddSession}
                >
                  + Add session
                </button>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              {[
                { id: 'latest10', label: 'Latest 10' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'All' }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSessionFilter(option.id)}
                  className={`px-2 py-1 rounded-lg text-xs ${
                    sessionFilter === option.id
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-900/40 text-slate-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="h-28 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getWeeklyReadingData(editItem.id)}>
                  <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value, name) => {
                      if (name === 'pages') return [`${value} pages`, 'Pages'];
                      return [`${value} h`, 'Time'];
                    }}
                  />
                  <Bar dataKey="pages" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="hours" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {getFilteredSessions(editItem.id).map((session) => (
                  <div key={session.id} className="flex items-center justify-between text-sm bg-slate-900/40 rounded-lg px-3 py-2">
                    <div className="text-slate-300">
                      {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-slate-400">
                      {session.pages} pages
                      {session.durationMinutes ? ` • ${formatDuration(session.durationMinutes)}` : ''}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-slate-400 hover:text-white text-xs"
                        onClick={() => openEditSession(session)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-400 hover:text-red-300 text-xs"
                        onClick={() => deleteSession(session.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              {readingSessions.filter(s => s.bookId === editItem.id).length === 0 && (
                <div className="text-slate-500 text-sm">No reading sessions yet.</div>
              )}
            </div>
          </Card>
        )}
      </Modal>

      <Modal
        isOpen={!!editSession}
        onClose={() => setEditSession(null)}
        title="Edit Reading Session"
      >
        {editSession && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm mb-2 block">Date</label>
              <input
                type="date"
                value={editSession.date}
                onChange={(e) => setEditSession(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-2 block">Pages Read</label>
              <input
                type="number"
                value={editSession.pages}
                onChange={(e) => setEditSession(prev => ({ ...prev, pages: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-2 block">Session Duration (optional)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={editSession.hours}
                  onChange={(e) => setEditSession(prev => ({ ...prev, hours: e.target.value }))}
                  placeholder="Hours"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                />
                <input
                  type="number"
                  value={editSession.minutes}
                  onChange={(e) => setEditSession(prev => ({ ...prev, minutes: e.target.value }))}
                  placeholder="Minutes"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setEditSession(null)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={updateSession}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showAddSession}
        onClose={() => setShowAddSession(false)}
        title="Add Reading Session"
      >
        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Date</label>
            <input
              type="date"
              value={newSession.date}
              onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Pages Read</label>
            <input
              type="number"
              value={newSession.pages}
              onChange={(e) => setNewSession(prev => ({ ...prev, pages: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Session Duration (optional)</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={newSession.hours}
                onChange={(e) => setNewSession(prev => ({ ...prev, hours: e.target.value }))}
                placeholder="Hours"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
              />
              <input
                type="number"
                value={newSession.minutes}
                onChange={(e) => setNewSession(prev => ({ ...prev, minutes: e.target.value }))}
                placeholder="Minutes"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAddSession(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={saveNewSession} disabled={!newSession.pages}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LibraryPage;
