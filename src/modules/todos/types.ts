export interface Todo {
  id: string
  title: string
  completed: boolean
  due_date: string | null
  created_at: string
}

export type TodoFilter = 'all' | 'active' | 'completed'
