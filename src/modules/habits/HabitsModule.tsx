import { useMemo, useState, type FormEvent } from 'react'
import { useHabits } from './useHabits'
import type { Habit, Part } from './types'
import { dayStr, longDate } from '../todos/dates'

const PARTS: { key: Part; label: string; icon: string }[] = [
  { key: 'morning', label: 'Morning', icon: '🌅' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { key: 'evening', label: 'Evening', icon: '🌙' },
  { key: 'anytime', label: 'Anytime', icon: '⭐' },
]
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const weekdayOf = (iso: string) => new Date(`${iso}T12:00:00`).getDay()

// "" = every day; otherwise the weekday must be in the list.
const scheduledOn = (habit: Habit, weekday: number) =>
  !habit.days || habit.days.split(',').map(Number).includes(weekday)

const repeatLabel = (days: string) => {
  if (!days) return 'Every day'
  const nums = days.split(',').map(Number)
  if (nums.length === 7) return 'Every day'
  return nums.map((n) => DAYS[n]).join(', ')
}

export default function HabitsModule() {
  const [date, setDate] = useState(dayStr(0))
  const { habits, logs, loading, error, addHabit, patchHabit, deleteHabit, setDone } =
    useHabits(date)
  const [managing, setManaging] = useState(false)

  const isToday = date === dayStr(0)
  const weekday = weekdayOf(date)
  const done = useMemo(() => new Set(logs.map((l) => l.habit_id)), [logs])

  // Active habits scheduled on this weekday, bucketed by part of day.
  const byPart = useMemo(() => {
    const map = new Map<Part, Habit[]>(PARTS.map((p) => [p.key, []]))
    for (const h of habits) {
      if (!h.active || !scheduledOn(h, weekday)) continue
      map.get(h.part)!.push(h)
    }
    return map
  }, [habits, weekday])

  const todays = [...byPart.values()].flat()
  const doneCount = todays.filter((h) => done.has(h.id)).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Habits</h1>
        <button
          type="button"
          className={`btn btn-sm ${managing ? 'btn-primary' : 'btn-ghost border-base-300'}`}
          onClick={() => setManaging((v) => !v)}
        >
          {managing ? 'Done' : 'Manage'}
        </button>
      </div>

      {managing ? (
        <Manage
          habits={habits}
          addHabit={addHabit}
          patchHabit={patchHabit}
          deleteHabit={deleteHabit}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              className="input input-bordered input-sm w-40"
              aria-label="Day"
              value={date}
              onChange={(e) => setDate(e.target.value || dayStr(0))}
            />
            {!isToday && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDate(dayStr(0))}>
                Today
              </button>
            )}
            <span className="text-sm text-base-content/60">
              {longDate(date)} · {doneCount}/{todays.length} done
            </span>
          </div>

          {error && (
            <div role="alert" className="alert alert-error text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : todays.length === 0 ? (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body items-center py-12 text-center text-base-content/50">
                No habits scheduled today. Tap <span className="font-semibold">Manage</span> to add
                one.
              </div>
            </div>
          ) : (
            PARTS.filter((p) => byPart.get(p.key)!.length > 0).map((p) => (
              <section key={p.key} className="flex flex-col gap-1">
                <h2 className="px-1 text-sm font-semibold text-base-content/60">
                  {p.icon} {p.label}
                </h2>
                <ul className="list rounded-box bg-base-100 shadow-sm">
                  {byPart.get(p.key)!.map((h) => {
                    const isDone = done.has(h.id)
                    return (
                      <li key={h.id} className="list-row items-center gap-3">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={isDone}
                          onChange={() => setDone(h.id, !isDone)}
                          aria-label={h.name}
                        />
                        <div className="min-w-0 flex-1">
                          <div className={`truncate font-medium ${isDone ? 'text-base-content/40 line-through' : ''}`}>
                            {h.name}
                          </div>
                          {h.notes && (
                            <div className="truncate text-xs text-base-content/60">{h.notes}</div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))
          )}
        </>
      )}
    </div>
  )
}

function Manage({
  habits,
  addHabit,
  patchHabit,
  deleteHabit,
}: {
  habits: Habit[]
  addHabit: (h: Partial<Habit>) => Promise<void>
  patchHabit: (id: string, p: Partial<Habit>) => Promise<void>
  deleteHabit: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [part, setPart] = useState<Part>('morning')
  const [days, setDays] = useState<number[]>([])
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const toggleDay = (n: number) =>
    setDays((prev) => (prev.includes(n) ? prev.filter((d) => d !== n) : [...prev, n]))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setFormError(null)
    try {
      await addHabit({
        name: name.trim(),
        part,
        days: [...days].sort((a, b) => a - b).join(','),
        notes: notes.trim() || null,
      })
      setName('')
      setDays([])
      setNotes('')
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="card bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            <input
              className="input input-bordered min-w-40 flex-1"
              placeholder="Habit (e.g. Meditate)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              className="select select-bordered w-40"
              value={part}
              onChange={(e) => setPart(e.target.value as Part)}
              aria-label="Part of day"
            >
              {PARTS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.icon} {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm text-base-content/60">
              Repeat {days.length === 0 && '· every day'}
            </span>
            <div className="flex flex-wrap gap-1">
              {DAYS.map((d, n) => (
                <button
                  key={n}
                  type="button"
                  className={`btn btn-sm ${days.includes(n) ? 'btn-primary' : 'btn-ghost border-base-300'}`}
                  onClick={() => toggleDay(n)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <input
            className="input input-bordered"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {formError && <div className="text-sm text-error">{formError}</div>}
          <button type="submit" className="btn btn-primary self-start" disabled={!name.trim()}>
            Add habit
          </button>
        </div>
      </form>

      {habits.length > 0 && (
        <ul className="list rounded-box bg-base-100 shadow-sm">
          {habits.map((h) => (
            <li key={h.id} className="list-row items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className={`font-medium ${h.active ? '' : 'text-base-content/40'}`}>
                  {h.name}{' '}
                  <span className="text-base-content/60">
                    · {PARTS.find((p) => p.key === h.part)?.label}
                  </span>
                </div>
                <div className="text-xs text-base-content/60">
                  {repeatLabel(h.days)}
                  {h.active ? '' : ' · inactive'}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => patchHabit(h.id, { active: !h.active })}
              >
                {h.active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs text-error"
                onClick={() => deleteHabit(h.id)}
                aria-label={`Delete ${h.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
