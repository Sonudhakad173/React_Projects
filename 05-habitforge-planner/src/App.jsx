import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'habitforge-habits';
const CATEGORY_OPTIONS = ['Health', 'Fitness', 'Study', 'Career', 'Mindfulness', 'Creative'];
const TODAY = makeDateKey(new Date());

function shiftDate(baseDate, deltaDays) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + deltaDays);
  return nextDate;
}

function makeDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toUtcTimestamp(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function sortDateKeys(dateKeys) {
  return [...new Set(dateKeys)].sort((left, right) => toUtcTimestamp(left) - toUtcTimestamp(right));
}

function buildCheckins(offsets) {
  return sortDateKeys(offsets.map((offset) => makeDateKey(shiftDate(new Date(), offset))));
}

function createSeedHabits() {
  return [
    {
      id: 'habit-1',
      name: '10-minute meditation',
      category: 'Mindfulness',
      target: 5,
      color: '#7c3aed',
      checkins: buildCheckins([0, -1, -2, -4])
    },
    {
      id: 'habit-2',
      name: 'React practice sprint',
      category: 'Career',
      target: 4,
      color: '#0ea5e9',
      checkins: buildCheckins([0, -1, -3])
    },
    {
      id: 'habit-3',
      name: 'Drink 2L water',
      category: 'Health',
      target: 7,
      color: '#10b981',
      checkins: buildCheckins([0, -1, -2, -3, -4, -5])
    },
    {
      id: 'habit-4',
      name: 'Evening walk',
      category: 'Fitness',
      target: 5,
      color: '#f97316',
      checkins: buildCheckins([0, -2, -4])
    }
  ];
}

const emptyForm = {
  name: '',
  category: 'Health',
  target: 5,
  color: '#7c3aed'
};

function loadHabits() {
  if (typeof window === 'undefined') {
    return createSeedHabits();
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) && saved.length > 0 ? saved : createSeedHabits();
  } catch {
    return createSeedHabits();
  }
}

function getCurrentStreak(checkins) {
  const checkinSet = new Set(checkins);
  let streak = 0;
  let cursor = new Date();

  cursor.setHours(0, 0, 0, 0);

  while (checkinSet.has(makeDateKey(cursor))) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }

  return streak;
}

function getBestStreak(checkins) {
  if (checkins.length === 0) {
    return 0;
  }

  const sorted = sortDateKeys(checkins);
  let best = 1;
  let current = 1;

  for (let index = 1; index < sorted.length; index += 1) {
    const previousDay = toUtcTimestamp(sorted[index - 1]);
    const currentDay = toUtcTimestamp(sorted[index]);

    if (currentDay - previousDay === 86400000) {
      current += 1;
    } else {
      current = 1;
    }

    best = Math.max(best, current);
  }

  return best;
}

function App() {
  const [habits, setHabits] = useState(loadHabits);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => makeDateKey(shiftDate(new Date(), -(6 - index))));
  }, []);

  const filteredHabits = useMemo(() => {
    const search = query.trim().toLowerCase();

    return habits.filter((habit) => {
      const matchesSearch = `${habit.name} ${habit.category}`.toLowerCase().includes(search);
      const matchesCategory = categoryFilter === 'All' || habit.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [habits, query, categoryFilter]);

  const metrics = useMemo(() => {
    const completedToday = filteredHabits.filter((habit) => habit.checkins.includes(TODAY)).length;
    const currentBestStreak = habits.reduce((best, habit) => Math.max(best, getBestStreak(habit.checkins)), 0);
    const weeklyCompleted = filteredHabits.reduce(
      (total, habit) => total + habit.checkins.filter((dateKey) => weekDates.includes(dateKey)).length,
      0
    );
    const weeklyPossible = filteredHabits.length * weekDates.length || 1;
    const weeklyRate = Math.round((weeklyCompleted / weeklyPossible) * 100);

    return {
      completedToday,
      currentBestStreak,
      weeklyRate
    };
  }, [filteredHabits, habits, weekDates]);

  function resetForm() {
    setForm(emptyForm);
    setEditingHabitId(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      return;
    }

    setHabits((currentHabits) => {
      if (editingHabitId) {
        return currentHabits.map((habit) =>
          habit.id === editingHabitId
            ? {
                ...habit,
                name: form.name.trim(),
                category: form.category,
                target: Number(form.target),
                color: form.color
              }
            : habit
        );
      }

      return [
        {
          id: `habit-${Date.now()}`,
          name: form.name.trim(),
          category: form.category,
          target: Number(form.target),
          color: form.color,
          checkins: []
        },
        ...currentHabits
      ];
    });

    resetForm();
  }

  function handleEdit(habit) {
    setEditingHabitId(habit.id);
    setForm({
      name: habit.name,
      category: habit.category,
      target: habit.target,
      color: habit.color
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(habitId) {
    setHabits((currentHabits) => currentHabits.filter((habit) => habit.id !== habitId));
    if (editingHabitId === habitId) {
      resetForm();
    }
  }

  function toggleToday(habitId) {
    setHabits((currentHabits) =>
      currentHabits.map((habit) => {
        if (habit.id !== habitId) {
          return habit;
        }

        const checkinSet = new Set(habit.checkins);

        if (checkinSet.has(TODAY)) {
          checkinSet.delete(TODAY);
        } else {
          checkinSet.add(TODAY);
        }

        return {
          ...habit,
          checkins: sortDateKeys(Array.from(checkinSet))
        };
      })
    );
  }

  return (
    <div className="shell habit-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Habit tracker portfolio</p>
          <h1>HabitForge Planner</h1>
          <p className="lede">
            A streak-focused planner with weekly progress, habit history, and persistent data for a realistic productivity demo.
          </p>
        </div>

        <div className="hero-metrics">
          <div className="metric">
            <span>Habits</span>
            <strong>{habits.length}</strong>
          </div>
          <div className="metric">
            <span>Done today</span>
            <strong>{metrics.completedToday}</strong>
          </div>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard label="Weekly rate" value={`${metrics.weeklyRate}%`} tone="accent" />
        <StatCard label="Best streak" value={`${metrics.currentBestStreak} days`} tone="success" />
        <StatCard label="Total habits" value={habits.length} tone="neutral" />
        <StatCard label="Completed today" value={metrics.completedToday} tone="warning" />
      </section>

      <section className="workspace">
        <aside className="panel form-panel">
          <div className="panel__header">
            <div>
              <p className="section-label">{editingHabitId ? 'Edit habit' : 'Add habit'}</p>
              <h2>{editingHabitId ? 'Refine your habit' : 'Create a new streak'}</h2>
            </div>
            {editingHabitId ? (
              <button type="button" className="text-button" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          <form className="habit-form" onSubmit={handleSubmit}>
            <label>
              <span>Habit name</span>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Read 20 pages"
              />
            </label>

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
                <span>Target per week</span>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={form.target}
                  onChange={(event) => setForm({ ...form, target: Number(event.target.value) || 1 })}
                />
              </label>
            </div>

            <label>
              <span>Accent color</span>
              <input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
            </label>

            <button className="primary-button" type="submit">
              {editingHabitId ? 'Save changes' : 'Add habit'}
            </button>
          </form>

        </aside>

        <main className="panel habits-panel">
          <div className="panel__header habits-header">
            <div>
              <p className="section-label">Habit dashboard</p>
              <h2>Track weekly consistency and keep momentum visible</h2>
            </div>
            <div className="filters">
              <input
                className="search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search habits or categories..."
              />
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="All">All categories</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <section className="week-strip">
            {weekDates.map((dateKey) => (
              <div key={dateKey} className="week-day">
                <span>{new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                <strong>{new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</strong>
              </div>
            ))}
          </section>

          <section className="habit-list">
            {filteredHabits.length > 0 ? (
              filteredHabits.map((habit) => {
                const currentStreak = getCurrentStreak(habit.checkins);
                const bestStreak = getBestStreak(habit.checkins);
                const weekCompleted = habit.checkins.filter((dateKey) => weekDates.includes(dateKey)).length;
                const progress = Math.min(100, Math.round((weekCompleted / habit.target) * 100));

                return (
                  <article key={habit.id} className="habit-card">
                    <div className="habit-card__header">
                      <div>
                        <span className="habit-chip" style={{ background: habit.color }}>
                          {habit.category}
                        </span>
                        <h3>{habit.name}</h3>
                      </div>
                      <strong>{weekCompleted}/{habit.target}</strong>
                    </div>

                    <div className="habit-stats">
                      <span>Current streak: {currentStreak} days</span>
                      <span>Best streak: {bestStreak} days</span>
                    </div>

                    <div className="day-row">
                      {weekDates.map((dateKey) => {
                        const isDone = habit.checkins.includes(dateKey);

                        return (
                          <span
                            key={dateKey}
                            className={isDone ? 'day-dot day-dot--done' : 'day-dot'}
                            title={`${habit.name} on ${dateKey}`}
                          />
                        );
                      })}
                    </div>

                    <div className="progress-bar">
                      <span style={{ width: `${progress}%`, background: habit.color }} />
                    </div>

                    <div className="habit-card__actions">
                      <button type="button" className="primary-button" onClick={() => toggleToday(habit.id)}>
                        {habit.checkins.includes(TODAY) ? 'Undo today' : 'Mark today'}
                      </button>
                      <button type="button" className="text-button" onClick={() => handleEdit(habit)}>
                        Edit
                      </button>
                      <button type="button" className="danger-button" onClick={() => handleDelete(habit.id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="empty-state">
                <p>No habits match the current filters.</p>
              </div>
            )}
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
