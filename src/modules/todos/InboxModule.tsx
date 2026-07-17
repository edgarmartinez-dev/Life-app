import { useState, type FormEvent } from 'react'
import { useTodos } from './useTodos'
import TodoList from './TodoList'
import { dayStr } from './dates'

// Tasks with no day, or scheduled beyond this week — use each row's 📅 to
// pull one into the week.
export default function InboxModule() {
  const { todos, loading, error, addTodo, patchTodo, deleteTodo } = useTodos()
  const [title, setTitle] = useState('')

  const sunday = dayStr(-((new Date().getDay() + 6) % 7) + 6)
  const visible = todos
    .filter((t) => !t.due_date || t.due_date > sunday)
    .slice()
    .sort((a, b) => Number(a.completed) - Number(b.completed) || a.position - b.position)

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    await addTodo(trimmed, null)
    setTitle('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="text-sm text-base-content/60">
          Tasks without a day, or scheduled after this week
        </p>
      </div>

      <form onSubmit={handleAdd} className="card bg-base-100 shadow-sm">
        <div className="card-body flex-row flex-wrap items-center gap-2 p-4">
          <input
            type="text"
            placeholder="Capture a task…"
            className="input input-bordered min-w-40 flex-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
            Add
          </button>
        </div>
      </form>

      {error && (
        <div role="alert" className="alert alert-error text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center py-12 text-base-content/50">
            Inbox zero — nothing waiting.
          </div>
        </div>
      ) : (
        <TodoList todos={visible} onPatch={patchTodo} onDelete={deleteTodo} />
      )}
    </div>
  )
}
