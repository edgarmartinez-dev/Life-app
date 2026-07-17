import { useCallback, useEffect, useState } from 'react'
import type { Medication, MedLog } from './types'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/medications${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error((body as { error?: string } | null)?.error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

// Meds + the dose logs for a single day. The daily view drives `date`.
export function useMeds(date: string) {
  const [meds, setMeds] = useState<Medication[]>([])
  const [logs, setLogs] = useState<MedLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [m, l] = await Promise.all([
        api<Medication[]>(''),
        api<MedLog[]>(`/logs?date=${date}`),
      ])
      setMeds(m)
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

  const addMed = async (med: Partial<Medication>) => {
    try {
      const created = await api<Medication>('', { method: 'POST', body: JSON.stringify(med) })
      setMeds((prev) => [...prev, created])
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  const patchMed = async (id: string, patch: Partial<Medication>) => {
    try {
      const updated = await api<Medication>(`/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
      setMeds((prev) => prev.map((m) => (m.id === id ? updated : m)))
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  const deleteMed = async (id: string) => {
    setMeds((prev) => prev.filter((m) => m.id !== id))
    try {
      await api(`/${id}`, { method: 'DELETE' })
    } catch (err) {
      setError((err as Error).message)
      load()
    }
  }

  // Mark a scheduled dose taken / undo. Optimistic; reloads on failure.
  const setTaken = async (medication_id: string, slot: number, taken: boolean) => {
    const key = (l: MedLog) => l.medication_id === medication_id && l.slot === slot
    if (taken) {
      const optimistic: MedLog = {
        id: `pending-${medication_id}-${slot}`,
        medication_id,
        date,
        slot,
        taken_at: new Date().toISOString(),
      }
      setLogs((prev) => [...prev.filter((l) => !key(l)), optimistic])
    } else {
      setLogs((prev) => prev.filter((l) => !key(l)))
    }
    try {
      await api('/logs', {
        method: taken ? 'POST' : 'DELETE',
        body: JSON.stringify({ medication_id, date, slot }),
      })
      if (taken) load() // pull the real taken_at timestamp
    } catch (err) {
      setError((err as Error).message)
      load()
    }
  }

  return { meds, logs, loading, error, addMed, patchMed, deleteMed, setTaken }
}
