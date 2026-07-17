import { useMemo, useState, type FormEvent } from 'react'
import { useTodos } from './useTodos'
import TodoItem from './TodoItem'
import type { TodoFilter } from './types'

const filters: TodoFilter[] = ['all', 'active', 'completed']

export default function TodosModule() {
  const { todos, loading, error, addTodo, toggleTodo, updateTitle, deleteTodo } = useTodos()
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [filter, setFilter] = useState<TodoFilter>('all')

  const visible = useMemo(() => {
    if (filter === 'active') return todos.filter((t) => !t.completed)
    if (filter === 'completed') return todos.filter((t) => t.completed)
    return todos
  }, [todos, filter])

  const remaining = todos.filter((t) => !t.completed).length

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    await addTodo(trimmed, dueDate || null)
    setTitle('')
    setDueDate('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">To-dos</h1>
        <p className="text-base-content/60 text-sm">
          {loading ? 'Loading…' : `${remaining} task${remaining === 1 ? '' : 's'} remaining`}
        </p>
      </div>

      <form onSubmit={handleAdd} className="card bg-base-100 shadow-sm">
        <div className="card-body p-4 flex-row flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Add a task…"
            className="input input-bordered flex-1 min-w-40"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="date"
            className="input input-bordered w-40"
            aria-label="Due date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
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

      <div role="tablist" className="tabs tabs-box w-fit">
        {filters.map((f) => (
          <button
            key={f}
            role="tab"
            type="button"
            className={`tab capitalize ${filter === f ? 'tab-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center text-base-content/50 py-12">
            {todos.length === 0 ? 'No tasks yet — add your first one above.' : 'Nothing here.'}
          </div>
        </div>
      ) : (
        <ul className="list bg-base-100 rounded-box shadow-sm">
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
