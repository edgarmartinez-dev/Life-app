import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Todo } from './types'
import TodoItem from './TodoItem'

interface TodoListProps {
  todos: Todo[]
  onPatch: (todo: Todo, patch: Partial<Todo>) => void
  onDelete: (todo: Todo) => void
}

export default function TodoList({ todos, onPatch, onDelete }: TodoListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const oldIndex = todos.findIndex((t) => t.id === active.id)
    const newIndex = todos.findIndex((t) => t.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const moved = todos[oldIndex]
    const reordered = arrayMove(todos, oldIndex, newIndex)
    // fractional position between the new neighbours — positions are global,
    // so ordering holds in every view that sorts by position
    const prev = reordered[newIndex - 1]?.position
    const next = reordered[newIndex + 1]?.position
    const position =
      prev === undefined && next === undefined
        ? 0
        : prev === undefined
          ? next! - 1
          : next === undefined
            ? prev + 1
            : (prev + next) / 2
    onPatch(moved, { position })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="list rounded-box bg-base-100 shadow-sm">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onPatch={(p) => onPatch(todo, p)}
              onDelete={() => onDelete(todo)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
