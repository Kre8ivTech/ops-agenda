import type { TaskSelect } from '@/lib/db/schema';
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
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KanbanBoard({ tasks }: KanbanBoardProps) {
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
    <div className="grid grid-cols-4 gap-4 items-start">
      {COLUMNS.map((col) => (
        <div key={col.key} className="flex flex-col gap-3">
          {/* Column header */}
          <div className="flex items-center justify-between rounded-[8px] bg-wash px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className={`inline-block h-[10px] w-[10px] rounded-full ${col.dotColor}`} />
              <span className="text-[0.88rem] font-extrabold text-ink">{col.label}</span>
            </div>
            <span className="font-mono text-[0.78rem] font-bold text-text-secondary">
              {columns[col.key].length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-3">
            {columns[col.key].map((task) => (
              <TaskCard key={task.id} task={task} column={col.key} />
            ))}
            {columns[col.key].length === 0 && (
              <div className="rounded-[8px] border border-dashed border-border px-3 py-6 text-center text-[0.82rem] text-text-secondary">
                No tasks
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
