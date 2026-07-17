export interface Medication {
  id: string
  name: string
  dose: string | null
  times: string // comma-sep HH:MM, "" if none
  active: boolean
  notes: string | null
  position: number
  created_at: string
}

export interface MedLog {
  id: string
  medication_id: string
  date: string
  slot: number
  taken_at: string
}
