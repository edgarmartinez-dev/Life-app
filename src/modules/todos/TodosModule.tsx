import { useMemo, useState, type FormEvent } from 'react'
import { useTodos } from './useTodos'
import TodoItem from './TodoItem'
import type { Todo } from './types'
import { dayStr, longDate, weekdayShort } from './dates'

interface Bucket {
  id: string
  label: string
  title: string
  date: string | null // concrete day → prefills the add form
  match: (t: Todo) => boolean
}

// ponytail: buckets are computed once per mount — reopen the app after midnight
function makeBuckets(): Bucket[] {
  const today = dayStr(0)
  const week = [1, 2, 3, 4].map((n) => dayStr(n))
  const last = week[week.length - 1]
  return [
    {
      id: 'past',
      label: 'Past',
      title: 'Overdue',
      date: null,
      match: (t) => !!t.due_date && t.due_date < today && !t.completed,
    },
    {
      id: 'today',
      label: 'Today',
      title: `Due: ${longDate(today)}`,
      date: today,
      match: (t) => t.due_date === today,
    },
    ...week.map((d, i) => ({
      id: d,
      label: i === 0 ? 'Tmrw' : weekdayShort(d),
      title: `Due: ${longDate(d)}`,
      date: d,
      match: (t: Todo) => t.due_date === d,
    })),
    {
      id: 'future',
      label: 'Future',
      title: 'Future',
      date: null,
      match: (t) => !!t.due_date && t.due_date > last,
    },
    {
      id: 'anytime',
      label: 'Any',
      title: 'No due date',
      date: null,
      match: (t) => !t.due_date,
    },
  ]
}

export default function TodosModule() {
  const { todos, loading, error, addTodo, toggleTodo, updateTitle, deleteTodo } = useTodos()
  const [title, setTitle] = useState('')
  // null = follow the selected day tab; '' = explicitly no date
  const [dueOverride, setDueOverride] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState('today')

  const buckets = useMemo(makeBuckets, [])
  const selected = buckets.find((b) => b.id === selectedId) ?? buckets[1]
  const dueDate = dueOverride ?? selected.date ?? ''

  const visible = useMemo(
    () =>
      todos
        .filter(selected.match)
        .slice()
        .sort(
          (a, b) =>
            Number(a.completed) - Number(b.completed) ||
            (a.due_date ?? '').localeCompare(b.due_date ?? '') ||
            b.created_at.localeCompare(a.created_at),
        ),
    [todos, selected],
  )

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    await addTodo(trimmed, dueDate || null)
    setTitle('')
    setDueOverride(null)
  }

  const chip = (label: string, value: string) => (
    <button
      type="button"
      className={`btn btn-xs ${dueDate === value ? 'btn-primary' : 'btn-ghost border-base-300'}`}
      onClick={() => setDueOverride(value)}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">To-dos</h1>

      <div className="flex overflow-x-auto rounded-box bg-base-100 shadow-sm">
        {buckets.map((b) => {
          const count = todos.filter((t) => !t.completed && b.match(t)).length
          const active = b.id === selected.id
          return (
            <button
              key={b.id}
              type="button"
              className={`flex min-w-16 flex-1 flex-col items-center gap-0.5 border-b-2 px-3 py-2 ${
                active ? 'border-primary' : 'border-transparent'
              }`}
              onClick={() => setSelectedId(b.id)}
            >
              <span
                className={`text-xs ${active ? 'font-semibold text-primary' : 'text-base-content/60'}`}
              >
                {b.label}
              </span>
              <span
                className={`text-lg font-bold ${
                  count === 0 ? 'text-base-content/30' : b.id === 'past' ? 'text-error' : ''
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <form onSubmit={handleAdd} className="card bg-base-100 shadow-sm">
        <div className="card-body flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Add a task…"
              className="input input-bordered min-w-40 flex-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
              Add
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {chip('Today', dayStr(0))}
            {chip('Tomorrow', dayStr(1))}
            {chip('No date', '')}
            <input
              type="date"
              className="input input-bordered input-sm w-36"
              aria-label="Due date"
              value={dueDate}
              onChange={(e) => setDueOverride(e.target.value)}
            />
          </div>
        </div>
      </form>

      {error && (
        <div role="alert" className="alert alert-error text-sm">
          {error}
        </div>
      )}

      <div className="text-sm text-base-content/60">{selected.title}</div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center py-12 text-base-content/50">
            Nothing here — enjoy the free time.
          </div>
        </div>
      ) : (
        <ul className="list rounded-box bg-base-100 shadow-sm">
          {visible.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => toggleTodo(todo)}
              onRename={(t) => updateTitle(todo, t)}
              onDelete={() => deleteTodo(todo)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
