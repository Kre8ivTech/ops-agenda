import type { TaskSelect } from '@/lib/db/schema';
import type { AssignableUser } from '@/lib/tasks/actions';
import { TaskCard, classifyTask, type KanbanColumn } from './task-card';

// ---------------------------------------------------------------------------
// Column config
// ---------------------------------------------------------------------------

interface ColumnDef {
  key: KanbanColumn;
  label: string;
  dotColor: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'inbox', label: 'Inbox', dotColor: 'bg-amber-500' },
  { key: 'today', label: 'Today', dotColor: 'bg-amber-500' },
  { key: 'in_progress', label: 'In progress', dotColor: 'bg-info' },
  { key: 'done', label: 'Done', dotColor: 'bg-signal' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface KanbanBoardProps {
  tasks: TaskSelect[];
  assignableUsers?: AssignableUser[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KanbanBoard({ tasks, assignableUsers = [] }: KanbanBoardProps) {
  // Classify tasks into columns
  const columns: Record<KanbanColumn, TaskSelect[]> = {
    inbox: [],
    today: [],
    in_progress: [],
    done: [],
  };

  for (const task of tasks) {
    const col = classifyTask(task);
    columns[col].push(task);
  }

  return (
    <div className="grid grid-cols-4 items-start gap-4">
      {COLUMNS.map((col) => (
        <div key={col.key} className="flex flex-col gap-3">
          {/* Column header */}
          <div className="bg-wash flex items-center justify-between rounded-[8px] px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className={`inline-block h-[10px] w-[10px] rounded-full ${col.dotColor}`} />
              <span className="text-ink text-[0.88rem] font-extrabold">{col.label}</span>
            </div>
            <span className="text-text-secondary font-mono text-[0.78rem] font-bold">
              {columns[col.key].length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-3">
            {columns[col.key].map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                column={col.key}
                assignableUsers={assignableUsers}
              />
            ))}
            {columns[col.key].length === 0 && (
              <div className="border-border text-text-secondary rounded-[8px] border border-dashed px-3 py-6 text-center text-[0.82rem]">
                No tasks
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
