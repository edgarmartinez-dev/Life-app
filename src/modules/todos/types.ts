export interface Todo {
  id: string
  title: string
  completed: boolean
  due_date: string | null
  due_time: string | null
  position: number
  created_at: string
}
