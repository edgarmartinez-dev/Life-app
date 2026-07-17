export interface Todo {
  id: string
  user_id: string
  title: string
  completed: boolean
  due_date: string | null
  created_at: string
}

export type TodoFilter = 'all' | 'active' | 'completed'
