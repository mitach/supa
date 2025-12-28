import { useState } from 'react';

import { getToday } from '../../utils';
import { Button } from '../Button';
import { TabBar } from '../TabBar';

const TransactionForm = ({ onSave, onDelete, initial, showDatePicker }) => {
  const [amount, setAmount] = useState(initial?.amount || '');
  const [type, setType] = useState(initial?.type || 'expense');
  const [category, setCategory] = useState(initial?.category || '');
  const [note, setNote] = useState(initial?.note || '');
  const [date, setDate] = useState(initial?.date || getToday());

  const categories = {
    expense: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Rent', 'Subscriptions', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Bonus', 'Refund', 'Other']
  };

  return (
    <div className="space-y-4">
      <TabBar
        tabs={[{ id: 'expense', label: 'Expense' }, { id: 'income', label: 'Income' }]}
        active={type}
        onChange={setType}
      />
      {showDatePicker && (
        <div>
          <label className="text-slate-400 text-sm mb-2 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
      )}
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-2xl font-bold focus:outline-none focus:border-amber-500/50"
        />
      </div>
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Category</label>
        <div className="flex flex-wrap gap-2">
          {categories[type].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                category === cat
                  ? 'bg-amber-500 text-slate-900 font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-slate-400 text-sm mb-2 block">Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
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
          onClick={() => amount && onSave({ amount: Number(amount), type, category, note, date })}
          disabled={!amount}
        >
          Save Transaction
        </Button>
      </div>
    </div>
  );
};

export { TransactionForm };
