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
    // so ordering holds in every view that sorts by position. Neighbours must
    // share the item's completed status: lists sort by (completed, position),
    // so a completed row's position says nothing about where an active row lands
    const prev = reordered
      .slice(0, newIndex)
      .reverse()
      .find((t) => t.completed === moved.completed)?.position
    const next = reordered
      .slice(newIndex + 1)
      .find((t) => t.completed === moved.completed)?.position
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

  const active = todos.filter((t) => !t.completed)
  const done = todos.filter((t) => t.completed)

  const renderList = (items: Todo[]) => (
    <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
      <ul className="list rounded-box bg-base-100 shadow-sm">
        {items.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onPatch={(p) => onPatch(todo, p)}
            onDelete={() => onDelete(todo)}
          />
        ))}
      </ul>
    </SortableContext>
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {active.length > 0 && renderList(active)}
      {done.length > 0 && (
        <details className="collapse collapse-arrow bg-base-100 shadow-sm">
          <summary className="collapse-title text-sm text-base-content/60">
            Completed ({done.length})
          </summary>
          <div className="collapse-content p-0">{renderList(done)}</div>
        </details>
      )}
    </DndContext>
  )
}
