import { useCallback, useEffect, useState } from 'react'
import type { Habit, HabitLog } from './types'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/habits${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error((body as { error?: string } | null)?.error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

// Habits + the done logs for a single day. The daily view drives `date`.
export function useHabits(date: string) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [h, l] = await Promise.all([
        api<Habit[]>(''),
        api<HabitLog[]>(`/logs?date=${date}`),
      ])
      setHabits(h)
      setLogs(l)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
    setLoading(false)
  }, [date])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const addHabit = async (habit: Partial<Habit>) => {
    try {
      const created = await api<Habit>('', { method: 'POST', body: JSON.stringify(habit) })
      setHabits((prev) => [...prev, created])
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  const patchHabit = async (id: string, patch: Partial<Habit>) => {
    try {
      const updated = await api<Habit>(`/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
      setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)))
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  const deleteHabit = async (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id))
    try {
      await api(`/${id}`, { method: 'DELETE' })
    } catch (err) {
      setError((err as Error).message)
      load()
    }
  }

  // Toggle a habit done / not-done for the day. Optimistic; reloads on failure.
  const setDone = async (habit_id: string, done: boolean) => {
    if (done) {
      const optimistic: HabitLog = {
        id: `pending-${habit_id}`,
        habit_id,
        date,
        done_at: new Date().toISOString(),
      }
      setLogs((prev) => [...prev.filter((l) => l.habit_id !== habit_id), optimistic])
    } else {
      setLogs((prev) => prev.filter((l) => l.habit_id !== habit_id))
    }
    try {
      await api('/logs', {
        method: done ? 'POST' : 'DELETE',
        body: JSON.stringify({ habit_id, date }),
      })
    } catch (err) {
      setError((err as Error).message)
      load()
    }
  }

  return { habits, logs, loading, error, addHabit, patchHabit, deleteHabit, setDone }
}
