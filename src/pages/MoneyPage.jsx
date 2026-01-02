import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Button, Card, Icons, Modal, TransactionForm } from '../components';
import { generateId, getToday } from '../utils';

const MoneyPage = ({ transactions, setTransactions }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const availableMonths = useMemo(() => {
    const months = new Set();
    const now = new Date();
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    transactions.forEach(t => {
      if (t.date) {
        months.add(t.date.substring(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const monthlyStats = useMemo(() => {
    const monthTransactions = transactions.filter(t => t.date?.startsWith(selectedMonth));

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const net = income - expenses;
    const savingsRate = income > 0 ? ((net / income) * 100).toFixed(0) : 0;

    const categoryBreakdown = {};
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'Other';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + t.amount;
      });

    const sortedCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1]);

    const incomeBreakdown = {};
    monthTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const cat = t.category || 'Other';
        incomeBreakdown[cat] = (incomeBreakdown[cat] || 0) + t.amount;
      });

    const sortedIncome = Object.entries(incomeBreakdown)
      .sort((a, b) => b[1] - a[1]);

    return {
      income,
      expenses,
      net,
      savingsRate,
      sortedCategories,
      sortedIncome,
      transactionCount: monthTransactions.length
    };
  }, [transactions, selectedMonth]);

  const yearlyStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearTransactions = transactions.filter(t => t.date?.startsWith(String(currentYear)));

    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      const monthStr = `${currentYear}-${String(month).padStart(2, '0')}`;
      const monthTx = yearTransactions.filter(t => t.date?.startsWith(monthStr));

      const income = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      monthlyData.push({
        month: new Date(currentYear, month - 1).toLocaleDateString('en-US', { month: 'short' }),
        monthKey: monthStr,
        income,
        expenses,
        net: income - expenses
      });
    }

    const totalIncome = yearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = yearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return {
      monthlyData,
      totalIncome,
      totalExpenses,
      totalNet: totalIncome - totalExpenses,
      avgMonthlyIncome: totalIncome / 12,
      avgMonthlyExpenses: totalExpenses / 12
    };
  }, [transactions]);

  const monthTransactions = useMemo(() => {
    return transactions
      .filter(t => t.date?.startsWith(selectedMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth]);

  const formatMonthLabel = (monthStr) => {
    const [year, month] = monthStr.split('-');
    return new Date(year, parseInt(month) - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setEditTransaction(null);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-start justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Money</h1>
          <p className="text-slate-400 text-sm">Track income & expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="border border-slate-800"
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'log' }))}
          >
            Edit Past Days
          </Button>
          <Button onClick={() => setShowAdd(true)}>
            <Icons.Plus />
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
        {availableMonths.map((month) => (
          <button
            key={month}
            onClick={() => setSelectedMonth(month)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm transition-all ${
              selectedMonth === month
                ? 'bg-amber-500 text-slate-900 font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {formatMonthLabel(month)}
          </button>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-3">{formatMonthLabel(selectedMonth)}</h3>
        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <div>
            <div className="text-emerald-400 text-2xl font-bold">${monthlyStats.income.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">Income</div>
          </div>
          <div>
            <div className="text-red-400 text-2xl font-bold">${monthlyStats.expenses.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">Expenses</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${monthlyStats.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {monthlyStats.net >= 0 ? '+' : '-'}${Math.abs(monthlyStats.net).toFixed(0)}
            </div>
            <div className="text-slate-500 text-xs">{monthlyStats.net >= 0 ? 'Saved' : 'Overspent'}</div>
          </div>
        </div>

        {monthlyStats.income > 0 && (
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Savings Rate</span>
              <span className={`font-semibold ${monthlyStats.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {monthlyStats.savingsRate}%
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  monthlyStats.net >= 0
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : 'bg-gradient-to-r from-red-500 to-red-400'
                }`}
                style={{ width: `${Math.min(100, Math.abs(monthlyStats.savingsRate))}%` }}
              />
            </div>
            <div className="text-center mt-2 text-sm">
              {monthlyStats.net >= 0 ? (
                <span className="text-emerald-400">Nice! You saved ${monthlyStats.net.toFixed(2)} this month.</span>
              ) : (
                <span className="text-red-400">Warning: You overspent by ${Math.abs(monthlyStats.net).toFixed(2)}.</span>
              )}
            </div>
          </div>
        )}
      </Card>

      {monthlyStats.sortedCategories.length > 0 && (
        <Card className="p-4">
          <h3 className="text-slate-400 text-sm mb-3">Expense Breakdown</h3>
          <div className="space-y-3">
            {monthlyStats.sortedCategories.map(([category, amount]) => {
              const percentage = (amount / monthlyStats.expenses) * 100;
              return (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{category}</span>
                    <span className="text-slate-400">${amount.toFixed(0)} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {monthlyStats.sortedIncome.length > 0 && (
        <Card className="p-4">
          <h3 className="text-slate-400 text-sm mb-3">Income Sources</h3>
          <div className="space-y-3">
            {monthlyStats.sortedIncome.map(([category, amount]) => {
              const percentage = (amount / monthlyStats.income) * 100;
              return (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{category}</span>
                    <span className="text-slate-400">${amount.toFixed(0)} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-3">Yearly Overview ({new Date().getFullYear()})</h3>
        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <div>
            <div className="text-emerald-400 text-lg font-bold">${yearlyStats.totalIncome.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">Total Income</div>
          </div>
          <div>
            <div className="text-red-400 text-lg font-bold">${yearlyStats.totalExpenses.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">Total Expenses</div>
          </div>
          <div>
            <div className={`text-lg font-bold ${yearlyStats.totalNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${Math.abs(yearlyStats.totalNet).toFixed(0)}
            </div>
            <div className="text-slate-500 text-xs">{yearlyStats.totalNet >= 0 ? 'Net Saved' : 'Net Loss'}</div>
          </div>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyStats.monthlyData} barGap={0}>
              <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(value, name) => [`$${value.toFixed(0)}`, name.charAt(0).toUpperCase() + name.slice(1)]}
              />
              <Bar dataKey="income" fill="#10b981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            <span className="text-slate-400 text-xs">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-slate-400 text-xs">Expenses</span>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-slate-400 text-sm mb-3">Monthly Savings Trend</h3>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yearlyStats.monthlyData}>
              <defs>
                <linearGradient id="netGradientPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                formatter={(value) => [`$${value.toFixed(0)}`, 'Net']}
              />
              <Area
                type="monotone"
                dataKey="net"
                stroke="#10b981"
                fill="url(#netGradientPos)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
          Transactions ({monthTransactions.length})
        </h2>
        {monthTransactions.map((t) => (
          <Card
            key={t.id}
            className="p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
            onClick={() => setEditTransaction(t)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                  </span>
                  {t.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {t.category}
                    </span>
                  )}
                </div>
                {t.note && <p className="text-slate-400 text-sm mt-1">{t.note}</p>}
              </div>
              <div className="text-slate-500 text-sm">
                {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </Card>
        ))}

        {monthTransactions.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No transactions this month. Add your first one!
          </div>
        )}
      </div>

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Transaction"
      >
        <TransactionForm
          onSave={(t) => {
            setTransactions(prev => [...prev, { ...t, id: generateId(), date: t.date || getToday() }]);
            setShowAdd(false);
          }}
          showDatePicker={true}
        />
      </Modal>

      <Modal
        isOpen={!!editTransaction}
        onClose={() => setEditTransaction(null)}
        title="Edit Transaction"
      >
        {editTransaction && (
          <TransactionForm
            initial={editTransaction}
            onSave={(t) => {
              setTransactions(prev => prev.map(tx =>
                tx.id === editTransaction.id ? { ...tx, ...t } : tx
              ));
              setEditTransaction(null);
            }}
            onDelete={() => deleteTransaction(editTransaction.id)}
            showDatePicker={true}
          />
        )}
      </Modal>
    </div>
  );
};

export default MoneyPage;
