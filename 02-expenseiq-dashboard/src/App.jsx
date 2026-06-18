import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'expenseiq-transactions';
const BUDGET_KEY = 'expenseiq-monthly-budget';

const CATEGORY_OPTIONS = [
  'Salary',
  'Freelance',
  'Food',
  'Transport',
  'Bills',
  'Shopping',
  'Health',
  'Travel',
  'Learning'
];

const TYPE_OPTIONS = ['Income', 'Expense'];
const TODAY = toDateKey(new Date());
const CURRENT_MONTH = toMonthKey(new Date());

const seedTransactions = [
  {
    id: 'txn-1',
    type: 'Income',
    amount: 4200,
    category: 'Salary',
    date: '2026-06-01',
    note: 'Monthly salary'
  },
  {
    id: 'txn-2',
    type: 'Expense',
    amount: 62,
    category: 'Food',
    date: '2026-06-04',
    note: 'Team lunch'
  },
  {
    id: 'txn-3',
    type: 'Expense',
    amount: 18,
    category: 'Transport',
    date: '2026-06-06',
    note: 'Metro ride'
  },
  {
    id: 'txn-4',
    type: 'Income',
    amount: 180,
    category: 'Freelance',
    date: '2026-06-10',
    note: 'UI polish task'
  },
  {
    id: 'txn-5',
    type: 'Expense',
    amount: 110,
    category: 'Learning',
    date: '2026-06-12',
    note: 'React course'
  },
  {
    id: 'txn-6',
    type: 'Expense',
    amount: 250,
    category: 'Shopping',
    date: '2026-06-15',
    note: 'Desk setup'
  }
];

const emptyForm = {
  type: 'Expense',
  amount: '',
  category: 'Food',
  date: TODAY,
  note: ''
};

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(amount);
}

function formatMonth(monthKey) {
  if (monthKey === 'All') {
    return 'All months';
  }

  const date = new Date(`${monthKey}-01T00:00:00`);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric'
  });
}

function loadTransactions() {
  if (typeof window === 'undefined') {
    return seedTransactions;
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) && saved.length > 0 ? saved : seedTransactions;
  } catch {
    return seedTransactions;
  }
}

function loadBudget() {
  if (typeof window === 'undefined') {
    return 2800;
  }

  const saved = Number(window.localStorage.getItem(BUDGET_KEY));
  return Number.isFinite(saved) && saved > 0 ? saved : 2800;
}

function App() {
  const [transactions, setTransactions] = useState(loadTransactions);
  const [monthlyBudget, setMonthlyBudget] = useState(loadBudget);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState(CURRENT_MONTH);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    window.localStorage.setItem(BUDGET_KEY, String(monthlyBudget));
  }, [monthlyBudget]);

  const monthOptions = useMemo(() => {
    const months = new Set(transactions.map((transaction) => toMonthKey(new Date(`${transaction.date}T00:00:00`))));
    months.add(CURRENT_MONTH);

    return Array.from(months).sort((left, right) => right.localeCompare(left));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const search = query.trim().toLowerCase();

    return [...transactions]
      .sort((left, right) => right.date.localeCompare(left.date))
      .filter((transaction) => {
        const matchesSearch =
          `${transaction.note} ${transaction.category} ${transaction.amount}`.toLowerCase().includes(search);
        const matchesType = typeFilter === 'All' || transaction.type === typeFilter;
        const matchesCategory = categoryFilter === 'All' || transaction.category === categoryFilter;
        const matchesMonth = monthFilter === 'All' || toMonthKey(new Date(`${transaction.date}T00:00:00`)) === monthFilter;

        return matchesSearch && matchesType && matchesCategory && matchesMonth;
      });
  }, [transactions, query, typeFilter, categoryFilter, monthFilter]);

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((transaction) => transaction.type === 'Income')
      .reduce((total, transaction) => total + transaction.amount, 0);
    const expense = filteredTransactions
      .filter((transaction) => transaction.type === 'Expense')
      .reduce((total, transaction) => total + transaction.amount, 0);
    const balance = income - expense;
    const savingsRate = income ? Math.max(0, Math.round((balance / income) * 100)) : 0;
    const transactionCount = filteredTransactions.length;

    return {
      income,
      expense,
      balance,
      savingsRate,
      transactionCount
    };
  }, [filteredTransactions]);

  const categoryBreakdown = useMemo(() => {
    const buckets = filteredTransactions
      .filter((transaction) => transaction.type === 'Expense')
      .reduce((result, transaction) => {
        result[transaction.category] = (result[transaction.category] || 0) + transaction.amount;
        return result;
      }, {});

    return Object.entries(buckets)
      .sort((left, right) => right[1] - left[1])
      .map(([category, amount]) => ({ category, amount }));
  }, [filteredTransactions]);

  const budgetUsage = monthlyBudget ? Math.round((summary.expense / monthlyBudget) * 100) : 0;
  const remainingBudget = monthlyBudget - summary.expense;

  function resetForm() {
    setForm(emptyForm);
    setEditingTransactionId(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const parsedAmount = Number(form.amount);

    if (!parsedAmount || parsedAmount <= 0) {
      return;
    }

    const normalizedTransaction = {
      id: editingTransactionId ?? `txn-${Date.now()}`,
      type: form.type,
      amount: parsedAmount,
      category: form.category,
      date: form.date,
      note: form.note.trim() || 'No note added'
    };

    setTransactions((currentTransactions) => {
      if (editingTransactionId) {
        return currentTransactions.map((transaction) =>
          transaction.id === editingTransactionId ? normalizedTransaction : transaction
        );
      }

      return [normalizedTransaction, ...currentTransactions];
    });

    resetForm();
  }

  function handleEdit(transaction) {
    setEditingTransactionId(transaction.id);
    setForm({
      type: transaction.type,
      amount: String(transaction.amount),
      category: transaction.category,
      date: transaction.date,
      note: transaction.note
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(transactionId) {
    setTransactions((currentTransactions) => currentTransactions.filter((transaction) => transaction.id !== transactionId));

    if (editingTransactionId === transactionId) {
      resetForm();
    }
  }

  return (
    <div className="shell finance-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Finance case study</p>
          <h1>ExpenseIQ Dashboard</h1>
          <p className="lede">
            A clean money dashboard for monitoring cash flow, categories, and monthly budget progress.
          </p>
        </div>

        <div className="budget-pill">
          <span>Budget target</span>
          <strong>{formatCurrency(monthlyBudget)}</strong>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard label="Income" value={formatCurrency(summary.income)} tone="success" />
        <StatCard label="Spending" value={formatCurrency(summary.expense)} tone="danger" />
        <StatCard label="Balance" value={formatCurrency(summary.balance)} tone="accent" />
        <StatCard label="Budget used" value={`${budgetUsage}%`} tone="neutral" />
      </section>

      <section className="workspace">
        <aside className="panel form-panel">
          <div className="panel__header">
            <div>
              <p className="section-label">{editingTransactionId ? 'Edit entry' : 'Add entry'}</p>
              <h2>{editingTransactionId ? 'Update transaction' : 'Log a new transaction'}</h2>
            </div>
            {editingTransactionId ? (
              <button className="text-button" type="button" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          <label className="budget-input">
            <span>Monthly budget</span>
            <input
              type="number"
              min="0"
              value={monthlyBudget || ''}
              onChange={(event) => setMonthlyBudget(Number(event.target.value) || 0)}
              placeholder="2800"
            />
          </label>

          <form className="finance-form" onSubmit={handleSubmit}>
            <div className="two-column">
              <label>
                <span>Type</span>
                <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  placeholder="125.50"
                />
              </label>
            </div>

            <div className="two-column">
              <label>
                <span>Category</span>
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                />
              </label>
            </div>

            <label>
              <span>Note</span>
              <textarea
                rows="4"
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
                placeholder="What was this transaction for?"
              />
            </label>

            <button className="primary-button" type="submit">
              {editingTransactionId ? 'Save changes' : 'Add transaction'}
            </button>
          </form>
        </aside>

        <main className="panel analytics-panel">
          <div className="panel__header analytics-header">
            <div>
              <p className="section-label">Financial overview</p>
              <h2>Filter by month, category, or transaction type</h2>
            </div>
            <div className="filters">
              <input
                className="search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notes, categories, or amounts"
              />
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="All">All types</option>
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="All">All categories</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
                <option value="All">All months</option>
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {formatMonth(month)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <section className="budget-card">
            <div className="budget-card__top">
              <div>
                <p className="section-label">Budget tracker</p>
                <h3>{formatMonth(monthFilter)}</h3>
              </div>
              <strong className={remainingBudget < 0 ? 'negative' : ''}>
                {remainingBudget >= 0 ? `${formatCurrency(remainingBudget)} left` : `${formatCurrency(Math.abs(remainingBudget))} over`}
              </strong>
            </div>
            <div className="meter">
              <span style={{ width: `${Math.min(100, Math.max(0, budgetUsage))}%` }} />
            </div>
            <p className="muted-copy">
              {budgetUsage}% of your budget is used. The snapshot reflects the currently selected month and filters.
            </p>
          </section>

          <section className="insights-grid">
            <article className="chart-panel">
              <div className="section-head">
                <h3>Spending by category</h3>
                <p>{summary.transactionCount} visible transactions</p>
              </div>

              <div className="bar-list">
                {categoryBreakdown.length > 0 ? (
                  categoryBreakdown.map((entry) => {
                    const maxAmount = categoryBreakdown[0].amount;
                    const width = maxAmount ? (entry.amount / maxAmount) * 100 : 0;

                    return (
                      <div key={entry.category} className="bar-row">
                        <div className="bar-row__label">
                          <span>{entry.category}</span>
                          <span>{formatCurrency(entry.amount)}</span>
                        </div>
                        <div className="bar">
                          <span style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <p>No expense data for the current filters.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="ledger-panel">
              <div className="section-head">
                <h3>Transaction history</h3>
                <p>{filteredTransactions.length} rows</p>
              </div>

              <div className="ledger-list">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="ledger-row">
                      <div className="ledger-row__main">
                        <strong>{transaction.note}</strong>
                        <p>
                          {transaction.category} · {transaction.date}
                        </p>
                      </div>
                      <div className="ledger-row__meta">
                        <span className={`type-pill type-pill--${transaction.type.toLowerCase()}`}>{transaction.type}</span>
                        <strong className={transaction.type === 'Expense' ? 'expense' : 'income'}>
                          {transaction.type === 'Expense' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </strong>
                        <div className="row-actions">
                          <button type="button" onClick={() => handleEdit(transaction)}>
                            Edit
                          </button>
                          <button type="button" className="danger-button" onClick={() => handleDelete(transaction.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No transactions match the current filters.</p>
                  </div>
                )}
              </div>
            </article>
          </section>
        </main>
      </section>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

export default App;
