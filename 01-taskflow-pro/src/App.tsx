import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';

type TaskStatus = 'Backlog' | 'In Progress' | 'Review' | 'Done';
type Priority = 'Low' | 'Medium' | 'High';
type Tone = 'accent' | 'success' | 'danger' | 'neutral' | 'warning';
type Theme = 'dark' | 'light';

type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  assignee: string;
};

type TaskFormState = {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  assignee: string;
};

type RouteLink = {
  to: string;
  label: string;
};

const STORAGE_KEY = 'taskflow-pro-tasks';
const STATUS_OPTIONS: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Done'];
const PRIORITY_OPTIONS: Priority[] = ['Low', 'Medium', 'High'];
const ROUTE_LINKS: RouteLink[] = [
  { to: '/', label: 'Board' },
  { to: '/insights', label: 'Insights' },
  { to: '/playbook', label: 'Playbook' }
];

const seedTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Design interview-ready landing page',
    description: 'Create a polished hero, CTA, and feature section that tells the product story clearly.',
    status: 'In Progress',
    priority: 'High',
    dueDate: '2026-06-24',
    assignee: 'Asha'
  },
  {
    id: 'task-2',
    title: 'Build reusable form controls',
    description: 'Refactor inputs, selects, and buttons into reusable pieces for faster UI development.',
    status: 'Backlog',
    priority: 'Medium',
    dueDate: '2026-06-28',
    assignee: 'Rahul'
  },
  {
    id: 'task-3',
    title: 'Prepare demo walkthrough',
    description: 'Write the product story, architecture highlights, and performance talking points.',
    status: 'Review',
    priority: 'High',
    dueDate: '2026-06-21',
    assignee: 'Meera'
  },
  {
    id: 'task-4',
    title: 'Ship mobile board layout',
    description: 'Tune spacing, stacking, and touch-friendly interactions for smaller screens.',
    status: 'Done',
    priority: 'Low',
    dueDate: '2026-06-18',
    assignee: 'Dev'
  },
  {
    id: 'task-5',
    title: 'Add task analytics cards',
    description: 'Show completion rate, overdue count, and board progress at the top.',
    status: 'Backlog',
    priority: 'Medium',
    dueDate: '2026-06-26',
    assignee: 'Priya'
  }
];

const emptyForm: TaskFormState = {
  title: '',
  description: '',
  priority: 'Medium',
  status: 'Backlog',
  dueDate: '',
  assignee: ''
};

function loadTasks(): Task[] {
  if (typeof window === 'undefined') {
    return seedTasks;
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null') as Task[] | null;
    return Array.isArray(saved) && saved.length > 0 ? saved : seedTasks;
  } catch {
    return seedTasks;
  }
}

function formatDate(dateValue: string) {
  if (!dateValue) {
    return 'No due date';
  }

  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

function isOverdue(dateValue: string) {
  if (!dateValue) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(`${dateValue}T00:00:00`) < today;
}

function TaskBoardPage() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | TaskStatus>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | Priority>('All');
  const [theme, setTheme] = useState<Theme>('dark');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const filteredTasks = useMemo(() => {
    const search = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const searchableText = `${task.title} ${task.description} ${task.assignee}`.toLowerCase();
      const matchesSearch = searchableText.includes(search);
      const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, query, statusFilter, priorityFilter]);

  const tasksByStatus = useMemo<Record<TaskStatus, Task[]>>(() => {
    return STATUS_OPTIONS.reduce((result, status) => {
      result[status] = filteredTasks.filter((task) => task.status === status);
      return result;
    }, {} as Record<TaskStatus, Task[]>);
  }, [filteredTasks]);

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === 'Done').length;
    const overdueTasks = tasks.filter((task) => task.status !== 'Done' && isOverdue(task.dueDate)).length;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate
    };
  }, [tasks]);

  function resetForm() {
    setForm(emptyForm);
    setEditingTaskId(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      return;
    }

    const normalizedTask = {
      id: editingTaskId ?? `task-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate,
      assignee: form.assignee.trim() || 'Unassigned'
    };

    setTasks((currentTasks) => {
      if (editingTaskId) {
        return currentTasks.map((task) => (task.id === editingTaskId ? normalizedTask : task));
      }

      return [normalizedTask, ...currentTasks];
    });

    resetForm();
  }

  function handleEdit(task: Task) {
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      assignee: task.assignee
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(taskId: string) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    if (editingTaskId === taskId) {
      resetForm();
    }
  }

  function handleMove(taskId: string, nextStatus: TaskStatus) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task))
    );
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>, nextStatus: TaskStatus) {
    event.preventDefault();

    if (draggedTaskId) {
      handleMove(draggedTaskId, nextStatus);
      setDraggedTaskId(null);
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <h1>TaskFlow Pro</h1>
          <p className="lede">
            A polished task workspace with drag and drop, persistence, filtering, and board analytics.
          </p>
        </div>

        <button className="ghost-button" type="button" onClick={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}>
          {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        </button>
      </header>

      <section className="stats-grid">
        <StatCard label="Total tasks" value={stats.totalTasks} tone="accent" />
        <StatCard label="Completed" value={stats.completedTasks} tone="success" />
        <StatCard label="Overdue" value={stats.overdueTasks} tone="danger" />
        <StatCard label="Completion rate" value={`${stats.completionRate}%`} tone="neutral" />
      </section>

      <section className="layout">
        <aside className="panel form-panel">
          <div className="panel__header">
            <div>
              <p className="section-label">{editingTaskId ? 'Edit task' : 'Add task'}</p>
              <h2>{editingTaskId ? 'Update a task' : 'Create a new task'}</h2>
            </div>
            {editingTaskId ? (
              <button className="text-button" type="button" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          <form className="task-form" onSubmit={handleSubmit}>
            <label>
              <span>Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Ship the dashboard hero"
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                rows="4"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Explain the work you want to track..."
              />
            </label>

            <div className="two-column">
              <label>
                <span>Assignee</span>
                <input
                  value={form.assignee}
                  onChange={(event) => setForm({ ...form, assignee: event.target.value })}
                  placeholder="Your name"
                />
              </label>

              <label>
                <span>Due date</span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                />
              </label>
            </div>

            <div className="two-column">
              <label>
                <span>Priority</span>
                <select
                  value={form.priority}
                  onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button className="primary-button" type="submit">
              {editingTaskId ? 'Save changes' : 'Add task'}
            </button>
          </form>
        </aside>

        <main className="panel board-panel">
          <div className="panel__header board-header">
            <div>
              <p className="section-label">Board controls</p>
              <h2>Search, filter, and drag tasks across columns</h2>
            </div>
            <div className="filters">
              <input
                className="search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, assignee, or note"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'All' | TaskStatus)}
              >
                <option value="All">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as 'All' | Priority)}
              >
                <option value="All">All priorities</option>
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <section className="board">
            {STATUS_OPTIONS.map((status) => {
              const columnTasks = tasksByStatus[status];

              return (
                <div
                  key={status}
                  className="column"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, status)}
                >
                  <div className="column__header">
                    <div>
                      <h3>{status}</h3>
                      <p>{columnTasks.length} tasks</p>
                    </div>
                    <span className="column__dot" />
                  </div>

                  <div className="column__cards">
                    {columnTasks.length > 0 ? (
                      columnTasks.map((task) => {
                        const currentIndex = STATUS_OPTIONS.indexOf(task.status);

                        return (
                          <article
                            key={task.id}
                            className={`task-card ${draggedTaskId === task.id ? 'task-card--dragging' : ''}`}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = 'move';
                              setDraggedTaskId(task.id);
                            }}
                            onDragEnd={() => setDraggedTaskId(null)}
                          >
                            <div className="task-card__header">
                              <span className={`priority priority--${task.priority.toLowerCase()}`}>{task.priority}</span>
                              <span className={`due-date ${isOverdue(task.dueDate) && task.status !== 'Done' ? 'due-date--late' : ''}`}>
                                {formatDate(task.dueDate)}
                              </span>
                            </div>

                            <h4>{task.title}</h4>
                            <p>{task.description}</p>

                            <div className="task-card__meta">
                              <span>{task.assignee}</span>
                              <span>{task.status}</span>
                            </div>

                            <div className="task-card__actions">
                              <button
                                type="button"
                                onClick={() => handleMove(task.id, STATUS_OPTIONS[Math.max(0, currentIndex - 1)])}
                                disabled={currentIndex === 0}
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMove(task.id, STATUS_OPTIONS[Math.min(STATUS_OPTIONS.length - 1, currentIndex + 1)])}
                                disabled={currentIndex === STATUS_OPTIONS.length - 1}
                              >
                                →
                              </button>
                              <button type="button" onClick={() => handleEdit(task)}>
                                Edit
                              </button>
                              <button type="button" className="danger-button" onClick={() => handleDelete(task.id)}>
                                Delete
                              </button>
                            </div>
                          </article>
                        );
                      })
                    ) : (
                      <div className="empty-state">
                        <p>Drop a task here or relax the filters.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        </main>
      </section>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string | number; tone: Tone }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function TaskFlowInsightsPage() {
  const completedTasks = seedTasks.filter((task) => task.status === 'Done').length;
  const overdueTasks = seedTasks.filter((task) => task.status !== 'Done' && isOverdue(task.dueDate)).length;
  const highPriorityTasks = seedTasks.filter((task) => task.priority === 'High').length;
  const statusBreakdown = STATUS_OPTIONS.map((status) => ({
    status,
    count: seedTasks.filter((task) => task.status === status).length
  }));

  return (
    <div className="shell route-page">
      <section className="panel route-panel">
        <div className="panel__header">
          <div>
            <p className="section-label">Insights</p>
            <h2>Show the metrics interviewers care about</h2>
          </div>
        </div>

        <section className="stats-grid route-stats-grid">
          <StatCard label="Seed tasks" value={seedTasks.length} tone="accent" />
          <StatCard label="Completed" value={completedTasks} tone="success" />
          <StatCard label="High priority" value={highPriorityTasks} tone="warning" />
          <StatCard label="Overdue" value={overdueTasks} tone="danger" />
        </section>

        <div className="route-grid">
          <article className="route-card">
            <h3>Board breakdown</h3>
            <div className="route-list">
              {statusBreakdown.map((entry) => (
                <div key={entry.status} className="route-list__row">
                  <span>{entry.status}</span>
                  <strong>{entry.count}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="route-card">
            <h3>How this helps you present</h3>
            <ul className="route-bullets">
              <li>Explains CRUD, filtering, and drag-and-drop in one clean project.</li>
              <li>Shows persistence with `localStorage` and derived dashboard stats.</li>
              <li>Makes it easy to demo responsive layouts and state-driven UI.</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}

function TaskFlowPlaybookPage() {
  return (
    <div className="shell route-page">
      <section className="panel route-panel">
        <div className="panel__header">
          <div>
            <p className="section-label">Playbook</p>
            <h2>Use this presentation flow when you present the project</h2>
          </div>
        </div>

        <div className="route-grid route-grid--three">
          <article className="route-card">
            <h3>System design</h3>
            <p>I split the task list, filters, board columns, and walkthrough pages so the experience feels product-ready.</p>
          </article>
          <article className="route-card">
            <h3>Interaction model</h3>
            <p>Controlled forms, cached filters, and local persistence keep every board action predictable and easy to demo.</p>
          </article>
          <article className="route-card">
            <h3>One-line summary</h3>
            <p>"I built a task board with drag-and-drop, editable cards, smart filtering, and guided presentation pages."</p>
          </article>
        </div>
      </section>
    </div>
  );
}

function App() {
  return (
    <div className="app-frame">
      <div className="shell route-shell">
        <div>
          <p className="eyebrow">TaskFlow Pro</p>
          <p className="route-copy">A multi-page task workspace with a board, insights, and a presentation playbook.</p>
        </div>

        <nav className="route-nav" aria-label="TaskFlow pages">
          {ROUTE_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `route-link ${isActive ? 'route-link--active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Routes>
        <Route path="/" element={<TaskBoardPage />} />
        <Route path="/insights" element={<TaskFlowInsightsPage />} />
        <Route path="/playbook" element={<TaskFlowPlaybookPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;

