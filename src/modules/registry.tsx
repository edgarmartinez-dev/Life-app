import type { ComponentType } from 'react'
import TodosModule from './todos/TodosModule'
import InboxModule from './todos/InboxModule'
import MedicationsModule from './medications/MedicationsModule'
import HabitsModule from './habits/HabitsModule'

export interface LifeModule {
  id: string
  name: string
  icon: string
  description: string
  status: 'active' | 'coming-soon'
  component?: ComponentType
}

/**
 * Central registry of Life app modules. To add a new area of your life
 * (medications, goals, finances, ...) add an entry here and point it at a
 * component under src/modules/<id>/ — the sidebar and routing pick it up
 * automatically.
 */
export const modules: LifeModule[] = [
  {
    id: 'todos',
    name: 'To-dos',
    icon: '✅',
    description: 'Tasks and daily checklist',
    status: 'active',
    component: TodosModule,
  },
  {
    id: 'inbox',
    name: 'Inbox',
    icon: '📥',
    description: 'Tasks without a day, or beyond this week',
    status: 'active',
    component: InboxModule,
  },
  {
    id: 'medications',
    name: 'Medications',
    icon: '💊',
    description: 'Medication reminders and history',
    status: 'active',
    component: MedicationsModule,
  },
  {
    id: 'habits',
    name: 'Habits',
    icon: '🔁',
    description: 'Recurring routines by part of day',
    status: 'active',
    component: HabitsModule,
  },
  {
    id: 'goals',
    name: 'Goals',
    icon: '🎯',
    description: 'Long-term goals and progress',
    status: 'coming-soon',
  },
]

export const defaultModuleId = modules.find((m) => m.status === 'active')!.id
