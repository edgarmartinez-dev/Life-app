export type Part = 'morning' | 'afternoon' | 'evening' | 'anytime'

export interface Habit {
  id: string
  name: string
  part: Part
  days: string // comma-sep weekday 0(Sun)-6(Sat), "" = every day
  active: boolean
  notes: string | null
  position: number
  created_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  date: string
  done_at: string
}
