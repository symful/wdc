import { useMemo } from "react";
import type { TaskPriority, TaskType } from "../../store/useTaskStore";
import { useTaskStore } from "../../store/useTaskStore";
import { translations, useLanguageStore } from "../../store/useLanguageStore";
import { useMissionBoardStore } from "../../store/useMissionBoardStore";
import {
  AlertCircle,
  Archive,
  Bolt,
  CheckCircle2,
  Flame,
  Lightbulb,
  PackageSearch,
  Plus,
  ScrollText,
  Star,
  X,
} from "lucide-react";

const MISSION_TIPS: Record<TaskType, string> = {
  tugas:
    "Break down subtasks to maintain momentum. Review core concepts before starting.",
  quiz:
    "Practice rapid-fire questions. Review formulas and key definitions briefly.",
  ujian:
    "Create a focused study block. Sleep well and review your weakest topics first.",
};

const MISSION_TIPS_ID: Record<TaskType, string> = {
  tugas:
    "Pecah tugas menjadi bagian kecil. Review konsep dasar sebelum memulai.",
  quiz: "Latihan soal cepat. Review rumus dan definisi kunci secara singkat.",
  ujian:
    "Buat blok belajar fokus. Tidur cukup dan review topik tersulit lebih dulu.",
};
import { FloatingActionButton } from "../../components/ui/FloatingActionButton";

export function MissionBoard() {
  const { addTask, deleteTask, moveTask, getSortedTasks } = useTaskStore();
  const { language } = useLanguageStore();
  const t = translations[language];

  const {
    showAddModal,
    viewMode,
    filterPriority,
    completingId,
    expandedId,
    form,
    setShowAddModal,
    setViewMode,
    setFilterPriority,
    setCompletingId,
    setExpandedId,
    setForm,
    resetForm,
  } = useMissionBoardStore();

  // Data
  const allTasks = getSortedTasks();

  const tips = language === "id" ? MISSION_TIPS_ID : MISSION_TIPS;

  // Handlers
  const handleAddTask = () => {
    if (!form.title || !form.deadline) return;
    addTask({
      title: form.title,
      type: form.type,
      deadline: new Date(form.deadline).toISOString(),
      priority: form.priority,
      weight: form.weight,
      estHours: 2,
      links: [],
    });
    setShowAddModal(false);
    resetForm();
  };

  const handleCompleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletingId(id);
    import("../../hooks/useRPGAudio").then(({ playSuccessSound }) =>
      playSuccessSound()
    );
    // Play stamp animation then move task
    setTimeout(() => {
      moveTask(id, "done");
      setCompletingId(null);
    }, 800);
  };

  // Helpers
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) {
      return language === "id"
        ? "Hari ini"
        : "Today";
    }
    if (d.toDateString() === tomorrow.toDateString()) {
      return language === "id"
        ? "Besok"
        : "Tomorrow";
    }
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const urgencyMap = useMemo(() => {
    const now = Date.now();
    const map: Record<string, { color: string; pulse: boolean; label: string }> = {};
    
    allTasks.forEach(task => {
      const d = new Date(task.deadline).getTime();
      const hoursLeft = (d - now) / (1000 * 60 * 60);

      if (hoursLeft < 24) {
        map[task.id] = {
          color: "var(--color-neon-red)",
          pulse: true,
          label: language === "id" ? "Kritis" : "Critical",
        };
      } else if (hoursLeft < 72) {
        map[task.id] = {
          color: "var(--color-neon-gold)",
          pulse: false,
          label: language === "id" ? "Mendesak" : "Urgent",
        };
      } else {
        map[task.id] = {
          color: "var(--color-neon-cyan)",
          pulse: false,
          label: language === "id" ? "Aman" : "Safe",
        };
      }
    });
    return map;
  }, [allTasks, language]);

  const getRarityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return {
          label: t.tasks.legendary || "S-Rank",
          class: "bg-neon-gold/10 text-neon-gold border-neon-gold/30",
          icon: <Star size={10} className="fill-neon-gold" />,
        };
      case "med":
        return {
          label: t.tasks.rare || "A-Rank",
          class: "bg-neon-purple/10 text-neon-purple border-neon-purple/30",
          icon: <Star size={10} className="fill-neon-purple" />,
        };
      case "low":
        return {
          label: t.tasks.common || "B-Rank",
          class: "bg-surface-2 text-text-muted border-white/10",
          icon: <Star size={10} />,
        };
    }
  };

  // Filtering
  let displayedTasks = allTasks.filter((t) =>
    viewMode === "active" ? t.status !== "done" : t.status === "done"
  );

  if (filterPriority !== "all") {
    displayedTasks = displayedTasks.filter((t) =>
      t.priority === filterPriority
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-10 sm:pb-0">
      <FloatingActionButton onClick={() => setShowAddModal(true)} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 pt-4 sm:pt-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 neon-glow-text font-display uppercase">
            Task Board
          </h1>
          <p className="text-text-muted text-base sm:text-lg max-w-2xl">
            {viewMode === "active"
              ? "Accept assignments and claim rewards."
              : "Task Log Archives"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center p-1 bg-surface-2 rounded-xl border border-neon-cyan/10 w-full sm:w-auto">
            <button
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                viewMode === "active"
                  ? "bg-neon-cyan/20 text-neon-cyan shadow-glow"
                  : "text-text-muted hover:text-text-main"
              }`}
              onClick={() => setViewMode("active")}
            >
              <ScrollText size={14} className="inline mr-2" />{" "}
              {t.tasks.bounties}
            </button>
            <button
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                viewMode === "archive"
                  ? "bg-neon-purple/20 text-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  : "text-text-muted hover:text-text-main"
              }`}
              onClick={() => setViewMode("archive")}
            >
              <Archive size={14} className="inline mr-2" />{" "}
              {t.tasks.archive}
            </button>
          </div>

          {viewMode === "active" && (
            <button
              className="hidden sm:flex btn btn-neon px-6 h-12 hover:scale-105 active:scale-95 transition-all group shadow-glow cursor-pointer"
              onClick={() => setShowAddModal(true)}
            >
              <Plus
                size={18}
                className="mr-2 group-hover:rotate-90 transition-transform inline"
              />
              <span className="font-black uppercase tracking-widest text-xs">
                {t.tasks.postBounty}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Filters (Active only) */}
      {viewMode === "active" && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              filterPriority === "all"
                ? "bg-surface-2 border-neon-cyan/30 text-neon-cyan"
                : "bg-transparent border-transparent text-text-muted hover:bg-surface-2/50"
            }`}
            onClick={() => setFilterPriority("all")}
          >
            {t.tasks.allTasks}
          </button>
          <button
            className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
              filterPriority === "high"
                ? "bg-neon-gold/10 border-neon-gold/30 text-neon-gold shadow-[0_0_15px_rgba(255,215,0,0.15)]"
                : "bg-transparent border-transparent text-text-muted hover:bg-surface-2/50"
            }`}
            onClick={() => setFilterPriority("high")}
          >
            <Flame
              size={12}
              className={filterPriority === "high" ? "animate-pulse" : ""}
            />{" "}
            {t.tasks.criticalPriority}
          </button>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20 items-start">
        {displayedTasks.length === 0
          ? (
            <div className="col-span-full py-32 flex flex-col items-center justify-center gap-6 game-panel border-dashed opacity-50">
              <PackageSearch size={64} className="text-text-muted/20" />
              <p className="text-text-muted text-xl font-bold font-display uppercase tracking-widest">
                {viewMode === "active"
                  ? t.tasks.noBounties
                  : t.tasks.archiveEmpty}
              </p>
            </div>
          )
          : (
            displayedTasks.map((task) => {
              const urgency = urgencyMap[task.id] || { color: "var(--color-neon-cyan)", pulse: false, label: "" };
              const rarity = getRarityBadge(task.priority);
              const isCompleting = completingId === task.id;

              return (
                <div
                  key={task.id}
                  className={`game-panel flex flex-col justify-between group overflow-hidden transition-all duration-500 relative bg-surface-1 hover:-translate-y-1 cursor-pointer ${
                    isCompleting
                      ? "scale-95 opacity-0 blur-sm pointer-events-none"
                      : "scale-100 opacity-100"
                  } ${
                    viewMode === "archive"
                      ? "opacity-70 grayscale hover:grayscale-0"
                      : ""
                  }`}
                  onClick={() =>
                    setExpandedId(expandedId === task.id ? null : task.id)}
                  style={{
                    borderTop: `4px solid ${urgencyMap[task.id]?.color || 'var(--color-neon-cyan)'}`,
                    boxShadow: (urgencyMap[task.id]?.pulse && !isCompleting)
                      ? `0 0 20px ${urgencyMap[task.id].color}40`
                      : "none",
                  }}
                >
                  {/* Stamp Animation Layer */}
                  {isCompleting && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                      <div className="border-4 border-neon-green text-neon-green px-6 py-2 rounded-lg font-black text-3xl uppercase tracking-[0.3em] font-display transform -rotate-12 animate-in zoom-in-50 duration-300 shadow-[0_0_30px_rgba(57,255,20,0.4)] bg-black/60 backdrop-blur-md">
                        {t.tasks.cleared}
                      </div>
                    </div>
                  )}

                  <div className="p-5 flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${rarity.class}`}
                          >
                            {rarity.icon} {rarity.label}
                          </span>
                          {task.type !== "tugas" && (
                            <span className="px-2 py-0.5 rounded bg-surface-2 border border-white/5 text-[8px] font-black uppercase tracking-widest text-text-muted/60">
                              {task.type}
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-lg leading-tight tracking-tight mt-1 text-text-main group-hover:text-neon-cyan transition-colors line-clamp-2">
                          {task.title}
                        </h3>
                      </div>

                      <button
                        className="p-2 text-text-muted/40 hover:text-neon-red transition-all rounded-lg hover:bg-neon-red/10 shrink-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Body Details */}
                    <div className="flex flex-row flex-wrap items-center gap-2 mt-2">
                      <div
                        className={`flex items-center gap-2 px-2 py-1 rounded-lg border bg-surface-2/50 ${
                          urgency.pulse
                            ? "border-neon-red/30"
                            : "border-white/5"
                        }`}
                      >
                        <AlertCircle
                          size={12}
                          style={{ color: urgencyMap[task.id]?.color }}
                          className={urgencyMap[task.id]?.pulse ? "animate-pulse" : ""}
                        />
                        <span
                          className="text-[10px] font-bold tabular-nums"
                          style={{ color: urgencyMap[task.id]?.color }}
                        >
                          {formatDate(task.deadline)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-neon-cyan/10 bg-surface-2/50">
                        <Bolt
                          size={12}
                          className="text-neon-cyan"
                          fill="currentColor"
                        />
                        <span className="text-[10px] font-black text-neon-cyan">
                          {task.weight} XP
                        </span>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        expandedId === task.id
                          ? "max-h-40 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="mt-2 p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/10 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-neon-cyan">
                          <Lightbulb size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {t.tasks.strategySuggestion}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed font-medium">
                          {tips[task.type]}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  {viewMode === "active" && (
                    <div className="p-2 mt-auto">
                      <button
                        className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] text-xs transition-all duration-300 font-display cursor-pointer bg-surface-2 text-text-muted/60 border border-white/5 hover:bg-neon-green hover:text-bg-main hover:border-neon-green hover:shadow-[0_0_20px_rgba(57,255,20,0.4)]"
                        onClick={(e) => handleCompleteTask(task.id, e)}
                      >
                        <CheckCircle2 size={16} /> {t.tasks.completeTask}
                      </button>
                    </div>
                  )}
                  {viewMode === "archive" && (
                    <div className="p-4 mt-auto border-t border-white/5 bg-surface-2/30">
                      <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted/40">
                        <CheckCircle2 size={14} className="text-neon-green" />
                        {" "}
                        {t.tasks.taskAccomplished}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-bg-main/80 backdrop-blur-xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="game-panel p-8 max-w-md w-full flex flex-col gap-6 border-neon-cyan/20 bg-surface-1 shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative overflow-hidden">
            <div className="flex justify-between items-center relative z-10">
              <h3 className="text-2xl font-black tracking-tight font-display neon-cyan-text uppercase">
                {t.tasks.postBounty}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-neon-cyan/10 rounded-full text-text-muted/40 hover:text-neon-cyan transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-5 relative z-10">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">
                  Task Target
                </label>
                <input
                  type="text"
                  className="w-full h-12 bg-surface-2 border border-neon-cyan/20 rounded-xl px-4 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all placeholder:text-text-muted/30"
                  value={form.title}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, title: e.target.value }))}
                  placeholder="e.g. Defeat the final bug"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  className="w-full h-12 bg-surface-2 border border-neon-cyan/20 rounded-xl px-4 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all text-text-main"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, deadline: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">
                    Type
                  </label>
                  <select
                    className="w-full h-12 bg-surface-2 border border-neon-cyan/20 rounded-xl px-4 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 appearance-none cursor-pointer"
                    value={form.type}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        type: e.target.value as TaskType,
                      }))}
                  >
                    <option value="tugas">Task</option>
                    <option value="quiz">Quiz</option>
                    <option value="ujian">Exam</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">
                    Priority (Rank)
                  </label>
                  <select
                    className="w-full h-12 bg-surface-2 border border-neon-cyan/20 rounded-xl px-4 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 appearance-none cursor-pointer"
                    value={form.priority}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        priority: e.target.value as TaskPriority,
                      }))}
                  >
                    <option value="low">B - Common</option>
                    <option value="med">A - Rare</option>
                    <option value="high">S - Legendary</option>
                  </select>
                </div>
              </div>

              <button
                className={`btn h-14 w-full text-sm rounded-xl font-black mt-2 transition-all duration-300 font-display uppercase tracking-widest
                  ${
                  !form.title || !form.deadline
                    ? "bg-surface-2 text-text-muted cursor-not-allowed border border-white/5"
                    : "btn-primary hover:scale-[1.02] shadow-[0_0_30px_rgba(0,240,255,0.2)] cursor-pointer"
                }`}
                onClick={handleAddTask}
                disabled={!form.title || !form.deadline}
              >
                {t.tasks.postBounty}
              </button>
            </div>

            {/* Background design elements */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none">
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
