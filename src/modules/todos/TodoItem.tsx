import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Todo } from './types'
import { dayStr } from './dates'

interface TodoItemProps {
  todo: Todo
  onPatch: (patch: Partial<Todo>) => void
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
      {todo.due_time ? ` · ${todo.due_time}` : ''}
    </span>
  )
}

export default function TodoItem({ todo, onPatch, onDelete }: TodoItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  })

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== todo.title) onPatch({ title: trimmed })
    else setDraft(todo.title)
    setEditing(false)
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`list-row items-center ${isDragging ? 'z-10 opacity-60' : ''}`}
    >
      <span
        className="cursor-grab touch-none select-none px-1 text-base-content/40"
        aria-label={`Drag to reorder "${todo.title}"`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </span>

      <input
        type="checkbox"
        className="checkbox checkbox-primary"
        checked={todo.completed}
        onChange={() => onPatch({ completed: !todo.completed })}
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
          className={`w-full text-left ${todo.completed ? 'line-through text-base-content/40' : ''}`}
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          {todo.title}
        </button>
      )}

      {dueBadge(todo)}

      <div className="dropdown dropdown-end">
        <button
          type="button"
          tabIndex={0}
          className="btn btn-ghost btn-xs"
          aria-label={`Set due date for "${todo.title}"`}
        >
          📅
        </button>
        <div
          tabIndex={0}
          className="dropdown-content z-30 mt-1 flex w-56 flex-col gap-2 rounded-box bg-base-100 p-3 shadow-lg"
        >
          <input
            type="date"
            className="input input-sm input-bordered w-full"
            value={todo.due_date ?? ''}
            aria-label={`Due date for "${todo.title}"`}
            onChange={(e) => onPatch({ due_date: e.target.value || null })}
          />
          <input
            type="time"
            className="input input-sm input-bordered w-full"
            value={todo.due_time ?? ''}
            aria-label={`Due time for "${todo.title}"`}
            onChange={(e) => onPatch({ due_time: e.target.value || null })}
          />
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => onPatch({ due_date: null, due_time: null })}
          >
            Clear date
          </button>
        </div>
      </div>

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
