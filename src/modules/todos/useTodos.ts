import { useCallback, useEffect, useState } from 'react'
import type { Todo } from './types'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/todos${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error((body as { error?: string } | null)?.error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setTodos(await api<Todo[]>(''))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addTodo = async (title: string, dueDate: string | null) => {
    try {
      const todo = await api<Todo>('', {
        method: 'POST',
        body: JSON.stringify({ title, due_date: dueDate }),
      })
      setTodos((prev) => [todo, ...prev])
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const toggleTodo = async (todo: Todo) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t)),
    )
    try {
      await api(`/${todo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !todo.completed }),
      })
    } catch (err) {
      setError((err as Error).message)
      load()
    }
  }

  const updateTitle = async (todo: Todo, title: string) => {
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, title } : t)))
    try {
      await api(`/${todo.id}`, { method: 'PATCH', body: JSON.stringify({ title }) })
    } catch (err) {
      setError((err as Error).message)
      load()
    }
  }

  const deleteTodo = async (todo: Todo) => {
    setTodos((prev) => prev.filter((t) => t.id !== todo.id))
    try {
      await api(`/${todo.id}`, { method: 'DELETE' })
    } catch (err) {
      setError((err as Error).message)
      load()
    }
  }

  return { todos, loading, error, addTodo, toggleTodo, updateTitle, deleteTodo }
}
