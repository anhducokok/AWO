import { useEffect, useState, useRef } from "react";
import { useTaskStore } from "@/stores/taskStore";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// ─── helpers ────────────────────────────────────────────────────────────────

const PRIORITY_META = {
  urgent:   { label: "Khẩn cấp", variant: "destructive",  color: "#ef4444" },
  high:     { label: "Cao",      variant: "destructive",  color: "#f97316" },
  medium:   { label: "Vừa",      variant: "default",      color: "#f59e0b" },
  low:      { label: "Thấp",     variant: "secondary",    color: "#10b981" },
};

const STATUS_COLUMNS = [
  { key: "todo",        label: "Cần làm",          badgeVariant: "secondary", accent: "#6b7280" },
  { key: "in_progress", label: "Đang tiến hành",   badgeVariant: "default",   accent: "#3b82f6" },
  { key: "review",      label: "Đang duyệt",       badgeVariant: "outline",   accent: "#8b5cf6" },
  { key: "done",        label: "Hoàn thành",       badgeVariant: "secondary", accent: "#10b981" },
];

const STATUS_ORDER = { todo: 0, in_progress: 1, review: 2, done: 3 };

const getInitials = (name = "") =>
  name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase() || "?";

const isOverdue = (deadline) =>
  deadline && new Date(deadline) < new Date();

// ─── TaskCard ────────────────────────────────────────────────────────────────

const TaskCard = ({ task, onDragStart }) => {
  const pm = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;
  const overdue = task.status !== "done" && isOverdue(task.deadline);
  const assigneeName = task.assignedTo?.name ?? task.assignedTo?.email ?? null;

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      className="hover:shadow-lg transition-all cursor-grab active:cursor-grabbing active:opacity-60 active:scale-95 group border-l-4"
      style={{ borderLeftColor: pm.color }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-1">
          <Badge variant={pm.variant} className="text-xs">
            {pm.label}
          </Badge>
          {assigneeName && (
            <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-[10px] font-semibold">
                {getInitials(assigneeName)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <CardTitle className="text-sm font-semibold leading-snug group-hover:text-blue-600 transition-colors">
          {task.title}
        </CardTitle>
        {task.description && (
          <CardDescription className="text-xs text-gray-500 line-clamp-2 mt-0.5">
            {task.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0 flex items-center justify-between">
        <div className={`flex items-center gap-1 text-xs ${overdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
          {overdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          <span>
            {task.deadline
              ? new Date(task.deadline).toLocaleDateString("vi-VN")
              : "Không có deadline"}
          </span>
        </div>
        {task.tags?.length > 0 && (
          <div className="flex gap-1">
            {task.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Column ──────────────────────────────────────────────────────────────────

const Column = ({ col, tasks, loading, onTaskDragStart, onTaskDrop, canDrop }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  // Track nested drag-enter/leave with a counter to avoid flicker
  const dragCounter = useRef(0);

  const handleDragOver = (e) => {
    if (!canDrop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e) => {
    if (!canDrop) return;
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    if (!canDrop) return;
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) onTaskDrop(taskId, col.key);
  };

  return (
    <div
      className="flex-1 min-w-[280px] max-w-[320px]"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className="flex items-center gap-2 mb-4 pb-3 border-b-2"
        style={{ borderColor: col.accent }}
      >
        <h2 className="font-bold text-sm text-gray-700 uppercase tracking-wide">
          {col.label}
        </h2>
        <Badge variant={col.badgeVariant} className="text-xs px-2 py-0.5">
          {tasks.length}
        </Badge>
      </div>

      <div
        className={`space-y-3 min-h-[120px] rounded-xl transition-all duration-150 p-1 -m-1 ${
          isDragOver && canDrop
            ? "ring-2 ring-offset-1 ring-blue-400 bg-blue-50/50"
            : ""
        }`}
      >
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={`sk-${i}`} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))
        ) : tasks.length === 0 ? (
          <div className={`h-24 flex items-center justify-center border-2 border-dashed rounded-lg transition-colors ${
            isDragOver && canDrop ? "border-blue-400 bg-blue-50" : "border-gray-200"
          }`}>
            <span className="text-xs text-gray-400">
              {isDragOver && canDrop ? "Thả vào đây" : "Không có tác vụ"}
            </span>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onDragStart={onTaskDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─── HomePage ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth();
  const { tasks, loading, fetchMyTasks, getKanbanColumns, moveTaskStatus, updateTask } = useTaskStore();
  const [activeFilter, setActiveFilter] = useState("all");
  // Track which task is being dragged (to compute valid drop targets)
  const draggingTask = useRef(null);
  const [dragSourceStatus, setDragSourceStatus] = useState(null);

  useEffect(() => {
    if (user?._id) {
      fetchMyTasks(user._id);
    }
  }, [user?._id]);

  const handleRefresh = () => {
    if (user?._id) fetchMyTasks(user._id);
  };

  const columns = getKanbanColumns();

  const filtered = (colTasks) => {
    if (activeFilter === "all") return colTasks;
    return colTasks.filter(t => t.priority === activeFilter);
  };

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const handleTaskDragStart = (e, task) => {
    e.dataTransfer.setData("taskId", task._id);
    e.dataTransfer.effectAllowed = "move";
    draggingTask.current = task;
    setDragSourceStatus(task.status);
  };

  const handleDragEnd = () => {
    draggingTask.current = null;
    setDragSourceStatus(null);
  };

  const handleTaskDrop = async (taskId, newStatus) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    // Forward-only guard
    if (STATUS_ORDER[newStatus] <= STATUS_ORDER[task.status]) return;

    // Optimistic update
    moveTaskStatus(taskId, newStatus);

    try {
      await updateTask(taskId, { status: newStatus });
      toast.success(`Đã chuyển sang "${STATUS_COLUMNS.find(c => c.key === newStatus)?.label}"`);
    } catch {
      // Revert on failure
      fetchMyTasks(user._id);
      toast.error("Cập nhật thất bại, vui lòng thử lại.");
    }
  };

  // A column can accept a drop only if the dragged task can move forward into it
  const canDropIntoColumn = (colKey) => {
    if (!dragSourceStatus) return false;
    return STATUS_ORDER[colKey] > STATUS_ORDER[dragSourceStatus];
  };

  return (
    <div className="space-y-6" onDragEnd={handleDragEnd}>
        {/* Board Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Tác vụ của tôi
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {user?.name ?? user?.email} · {tasks.length} tác vụ
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Priority quick-filter */}
            <div className="flex gap-1 bg-white border rounded-lg p-1 shadow-sm">
              {[
                { key: "all",    label: "Tất cả" },
                { key: "urgent", label: "Khẩn" },
                { key: "high",   label: "Cao" },
                { key: "medium", label: "Vừa" },
                { key: "low",    label: "Thấp" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    activeFilter === f.key
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
              className="shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>


        {/* Kanban Board */}
        <div className="flex gap-5 overflow-x-auto pb-6">
          {STATUS_COLUMNS.map(col => (
            <Column
              key={col.key}
              col={col}
              tasks={filtered(columns[col.key] ?? [])}
              loading={loading}
              onTaskDragStart={handleTaskDragStart}
              onTaskDrop={handleTaskDrop}
              canDrop={canDropIntoColumn(col.key)}
            />
          ))}
        </div>
    </div>
  );
}
