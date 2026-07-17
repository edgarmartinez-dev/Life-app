import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Todo } from './types'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error: err } = await supabase!
      .from('todos')
      .select('*')
      .order('completed', { ascending: true })
      .order('created_at', { ascending: false })
    if (err) {
      setError(err.message)
    } else {
      setTodos(data as Todo[])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addTodo = async (title: string, dueDate: string | null) => {
    const user = (await supabase!.auth.getUser()).data.user
    if (!user) return
    const { data, error: err } = await supabase!
      .from('todos')
      .insert({ title, due_date: dueDate, user_id: user.id })
      .select()
      .single()
    if (err) {
      setError(err.message)
      return
    }
    setTodos((prev) => [data as Todo, ...prev])
  }

  const toggleTodo = async (todo: Todo) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t)),
    )
    const { error: err } = await supabase!
      .from('todos')
      .update({ completed: !todo.completed })
      .eq('id', todo.id)
    if (err) {
      setError(err.message)
      load()
    }
  }

  const updateTitle = async (todo: Todo, title: string) => {
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, title } : t)))
    const { error: err } = await supabase!.from('todos').update({ title }).eq('id', todo.id)
    if (err) {
      setError(err.message)
      load()
    }
  }

  const deleteTodo = async (todo: Todo) => {
    setTodos((prev) => prev.filter((t) => t.id !== todo.id))
    const { error: err } = await supabase!.from('todos').delete().eq('id', todo.id)
    if (err) {
      setError(err.message)
      load()
    }
  }

  return { todos, loading, error, addTodo, toggleTodo, updateTitle, deleteTodo }
}
