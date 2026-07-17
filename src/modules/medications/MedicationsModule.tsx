import { useMemo, useState, type FormEvent } from 'react'
import { useMeds } from './useMeds'
import type { Medication, MedLog } from './types'
import { dayStr, longDate } from '../todos/dates'

const nowHHMM = () => new Date().toTimeString().slice(0, 5)

// Flattened "dose" = one scheduled slot of one medication on the day.
interface Dose {
  med: Medication
  slot: number
  time: string
}

export default function MedicationsModule() {
  const [date, setDate] = useState(dayStr(0))
  const { meds, logs, loading, error, addMed, patchMed, deleteMed, setTaken } = useMeds(date)
  const [managing, setManaging] = useState(false)
  const [confirm, setConfirm] = useState<{ dose: Dose; taken: boolean } | null>(null)

  const isToday = date === dayStr(0)
  const taken = useMemo(
    () => new Set(logs.map((l) => `${l.medication_id}:${l.slot}`)),
    [logs],
  )
  const logByKey = useMemo(() => {
    const m = new Map<string, MedLog>()
    for (const l of logs) m.set(`${l.medication_id}:${l.slot}`, l)
    return m
  }, [logs])

  // Every scheduled dose across active meds, in clock order.
  const doses = useMemo<Dose[]>(() => {
    const out: Dose[] = []
    for (const med of meds) {
      if (!med.active || !med.times) continue
      med.times.split(',').forEach((time, slot) => out.push({ med, slot, time }))
    }
    return out.sort((a, b) => a.time.localeCompare(b.time))
  }, [meds])

  const doneCount = doses.filter((d) => taken.has(`${d.med.id}:${d.slot}`)).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Medications</h1>
        <button
          type="button"
          className={`btn btn-sm ${managing ? 'btn-primary' : 'btn-ghost border-base-300'}`}
          onClick={() => setManaging((v) => !v)}
        >
          {managing ? 'Done' : 'Manage'}
        </button>
      </div>

      {managing ? (
        <Manage meds={meds} addMed={addMed} patchMed={patchMed} deleteMed={deleteMed} />
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
              {longDate(date)} · {doneCount}/{doses.length} taken
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
          ) : doses.length === 0 ? (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body items-center py-12 text-center text-base-content/50">
                No scheduled doses. Tap <span className="font-semibold">Manage</span> to add a
                medication with times.
              </div>
            </div>
          ) : (
            <ul className="list rounded-box bg-base-100 shadow-sm">
              {doses.map((d) => {
                const key = `${d.med.id}:${d.slot}`
                const isTaken = taken.has(key)
                const overdue = isToday && !isTaken && d.time < nowHHMM()
                const log = logByKey.get(key)
                return (
                  <li key={key} className="list-row items-center gap-3">
                    <span className="w-14 shrink-0 font-mono text-sm text-base-content/70">
                      {d.time}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate font-medium ${isTaken ? 'text-base-content/40' : ''}`}>
                        {d.med.name}
                      </div>
                      <div className="text-xs text-base-content/60">
                        {d.med.dose ?? 'dose unset'}
                        {isTaken && log && !log.id.startsWith('pending')
                          ? ` · taken ${new Date(log.taken_at + 'Z').toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
                          : ''}
                      </div>
                    </div>
                    {overdue && <span className="badge badge-error badge-sm">overdue</span>}
                    {isTaken ? (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => setConfirm({ dose: d, taken: false })}
                      >
                        ✓ Taken
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setConfirm({ dose: d, taken: true })}
                      >
                        Mark taken
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      {confirm && (
        <ConfirmModal
          dose={confirm.dose}
          taken={confirm.taken}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setTaken(confirm.dose.med.id, confirm.dose.slot, confirm.taken)
            setConfirm(null)
          }}
        />
      )}
    </div>
  )
}

function ConfirmModal({
  dose,
  taken,
  onConfirm,
  onCancel,
}: {
  dose: Dose
  taken: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="modal modal-open" role="dialog" aria-modal="true">
      <div className="modal-box">
        <h3 className="text-lg font-bold">{taken ? 'Confirm dose' : 'Undo dose'}</h3>
        <p className="py-3">
          {taken ? 'Did you take' : 'Mark as NOT taken:'}{' '}
          <span className="font-semibold">{dose.med.name}</span>
          {dose.med.dose ? ` — ${dose.med.dose}` : ''} at {dose.time}?
        </p>
        {dose.med.notes && <p className="text-sm text-base-content/60">{dose.med.notes}</p>}
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${taken ? 'btn-success' : 'btn-warning'}`}
            onClick={onConfirm}
            autoFocus
          >
            {taken ? 'Yes, taken' : 'Yes, undo'}
          </button>
        </div>
      </div>
      <button type="button" className="modal-backdrop" onClick={onCancel} aria-label="Close" />
    </div>
  )
}

function Manage({
  meds,
  addMed,
  patchMed,
  deleteMed,
}: {
  meds: Medication[]
  addMed: (m: Partial<Medication>) => Promise<void>
  patchMed: (id: string, p: Partial<Medication>) => Promise<void>
  deleteMed: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [times, setTimes] = useState<string[]>([''])
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setFormError(null)
    try {
      await addMed({
        name: name.trim(),
        dose: dose.trim() || null,
        times: times.filter(Boolean).join(','),
        notes: notes.trim() || null,
      })
      setName('')
      setDose('')
      setTimes([''])
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
              placeholder="Name (e.g. Metformin)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="input input-bordered w-40"
              placeholder="Dose (e.g. 500 mg)"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm text-base-content/60">Times per day</span>
            <div className="flex flex-wrap items-center gap-2">
              {times.map((t, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    type="time"
                    className="input input-bordered input-sm w-28"
                    value={t}
                    onChange={(e) =>
                      setTimes((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
                    }
                  />
                  {times.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => setTimes((prev) => prev.filter((_, j) => j !== i))}
                      aria-label="Remove time"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setTimes((prev) => [...prev, ''])}
              >
                + time
              </button>
            </div>
          </div>

          <input
            className="input input-bordered"
            placeholder="Notes (optional — e.g. with food)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {formError && <div className="text-sm text-error">{formError}</div>}
          <button type="submit" className="btn btn-primary self-start" disabled={!name.trim()}>
            Add medication
          </button>
        </div>
      </form>

      {meds.length > 0 && (
        <ul className="list rounded-box bg-base-100 shadow-sm">
          {meds.map((m) => (
            <li key={m.id} className="list-row items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className={`font-medium ${m.active ? '' : 'text-base-content/40'}`}>
                  {m.name} {m.dose ? <span className="text-base-content/60">· {m.dose}</span> : null}
                </div>
                <div className="text-xs text-base-content/60">
                  {m.times ? m.times.split(',').join(', ') : 'no schedule'}
                  {m.active ? '' : ' · inactive'}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => patchMed(m.id, { active: !m.active })}
              >
                {m.active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs text-error"
                onClick={() => deleteMed(m.id)}
                aria-label={`Delete ${m.name}`}
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
