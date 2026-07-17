import { useState } from 'react'
import type { Todo } from './types'
import { dayStr } from './dates'

interface TodoItemProps {
  todo: Todo
  onToggle: () => void
  onRename: (title: string) => void
  onDelete: () => void
}

function dueBadge(todo: Todo) {
  if (!todo.due_date || todo.completed) return null
  const today = dayStr()
  const overdue = todo.due_date < today
  const isToday = todo.due_date === today
  return (
    <span
      className={`badge badge-sm ${overdue ? 'badge-error' : isToday ? 'badge-warning' : 'badge-ghost'}`}
    >
      {overdue ? 'overdue · ' : ''}
      {todo.due_date}
    </span>
  )
}

export default function TodoItem({ todo, onToggle, onRename, onDelete }: TodoItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== todo.title) onRename(trimmed)
    else setDraft(todo.title)
    setEditing(false)
  }

  return (
    <li className="list-row items-center">
      <input
        type="checkbox"
        className="checkbox checkbox-primary"
        checked={todo.completed}
        onChange={onToggle}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'not done' : 'done'}`}
      />

      {editing ? (
        <input
          type="text"
          className="input input-sm input-bordered w-full"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') {
              setDraft(todo.title)
              setEditing(false)
            }
          }}
        />
      ) : (
        <button
          type="button"
          className={`text-left w-full ${todo.completed ? 'line-through text-base-content/40' : ''}`}
          onDoubleClick={() => setEditing(true)}
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          {todo.title}
        </button>
      )}

      {dueBadge(todo)}

      <button
        type="button"
        className="btn btn-ghost btn-xs text-error"
        onClick={onDelete}
        aria-label={`Delete "${todo.title}"`}
      >
        ✕
      </button>
    </li>
  )
}
