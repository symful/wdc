import { SemesterType, useAcademicStore } from "../../store/useAcademicStore";
import { StudySession, useStudyStore } from "../../store/useStudyStore";
import { useAchievementStore } from "../../store/useAchievementStore";
import { Timer } from "lucide-react";
import { translations, useLanguageStore } from "../../store/useLanguageStore";
import { useProfileStore } from "../../store/useProfileStore";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  Crosshair,
  Flame,
  Gem,
  GraduationCap,
  History,
  Info,
  Lock,
  Moon,
  Plus,
  Shield,
  Swords,
  Trash2,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { StatsSection } from "./StatsSection";

export function ProfileView() {
  const {
    semesters,
    activeSemesterId,
    addSemester,
    deleteSemester,
    setActiveSemester,
    xpLogs,
  } = useAcademicStore();


  const { sessions } = useStudyStore();
  const { language } = useLanguageStore();
  const t = translations[language];
  const { achievements } = useAchievementStore();

  const {
    showAddModal,
    showLogModal,
    form,
    setShowAddModal,
    setShowLogModal,
    setForm,
    resetForm,
  } = useProfileStore();

  const activeSemester = semesters.find((s) => s.id === activeSemesterId);


  // Real XP from Logs
  const xp = xpLogs.reduce((acc, log) => acc + log.amount, 0);
  const level = Math.floor(xp / 1000) + 1; // 1000 XP per level
  const xpProgress = ((xp % 1000) / 1000) * 100;

  const handleAddSemester = () => {
    addSemester(form);
    setShowAddModal(false);
    resetForm(semesters.length + 2);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-10 sm:pb-0">
      <div className="flex items-center justify-between flex-wrap gap-6 pt-4 sm:pt-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 neon-glow-text font-display uppercase">
            {t.profile.title}
          </h1>
          <p className="text-text-muted text-base sm:text-lg max-w-2xl">
            {t.profile.subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Semester Management */}
        <div className="lg:col-span-1 order-1">
          <div className="game-panel p-8 flex flex-col gap-6 h-full">
            <h3 className="text-lg font-black flex items-center gap-3 tracking-tight font-display">
              <div className="p-2 bg-neon-cyan/10 rounded-xl border border-neon-cyan/20">
                <GraduationCap size={20} className="text-neon-cyan" />
              </div>
              <span className="neon-cyan-text">{t.profile.semester}</span>
            </h3>

            {semesters.length > 0
              ? (
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <select
                      className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all appearance-none cursor-pointer pr-12"
                      value={activeSemesterId || ""}
                      onChange={(e) => setActiveSemester(e.target.value)}
                    >
                      {semesters.map((s) => (
                        <option key={s.id} value={s.id} className="bg-bg-main">
                          {t.profile.semester} {s.number} - {s.year}{" "}
                          ({s.type === "ganjil"
                            ? t.profile.ganjil
                            : t.profile.genap})
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted/40 pointer-events-none"
                      size={20}
                    />
                  </div>

                  <button
                    className="btn btn-glass w-full h-12 justify-center rounded-xl text-xs font-black uppercase tracking-widest gap-2"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus size={16} /> {t.profile.addSemester}
                  </button>
                </div>
              )
              : (
                <div className="flex flex-col items-center gap-6 py-4">
                  <p className="text-text-muted text-sm text-center italic">
                    {t.profile.noSemester}
                  </p>
                  <button
                    className="btn btn-primary w-full h-14 justify-center rounded-2xl text-xs font-black uppercase tracking-widest gap-2"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus size={20} /> {t.profile.addSemester}
                  </button>
                </div>
              )}
          </div>
        </div>

        {/* Player Level Card (order 2 on mobile) */}
        <div className="lg:col-span-1 order-2 lg:order-3">
          <div className="game-panel p-6 flex flex-col h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-3xl group-hover:bg-neon-cyan/10 transition-all">
            </div>

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/20 flex items-center justify-center">
                  <Trophy size={18} className="text-neon-cyan" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 font-display">
                    {t.common.playerLevel}
                  </div>
                  <div className="text-lg font-black text-text-main leading-none mt-1">
                    Level {level}{" "}
                    <span className="text-neon-gold text-xs ml-2 tabular-nums">
                      {xp} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="xp-bar relative z-10 h-1.5 mb-2">
              <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }}>
              </div>
            </div>
            <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-text-muted/40 mb-8 font-display">
              <span>{Math.round(xpProgress)}%</span>
              <span>LVL {level + 1}</span>
            </div>

            <div className="flex-1"></div>

            <button
              className="mt-4 w-full py-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-neon-cyan hover:bg-neon-cyan/5 hover:border-neon-cyan/20 transition-all cursor-pointer font-display"
              onClick={() => setShowLogModal(true)}
            >
              {t.profile.viewActivityLog}
            </button>
          </div>
        </div>

        {/* Player Statistics Section */}
        <div className="lg:col-span-3 order-4">
          <StatsSection />
        </div>

        {/* Trophy Case - Achievement Badges */}
        <div className="lg:col-span-3 order-5">
          <div className="game-panel p-8 flex flex-col gap-6">
            <h3 className="text-lg font-black flex items-center gap-3 tracking-tight font-display">
              <div className="p-2 bg-neon-gold/10 rounded-xl border border-neon-gold/20">
                <Trophy size={20} className="text-neon-gold" />
              </div>
              <span className="neon-gold-text uppercase tracking-widest">
                {language === "id" ? "Trophy Case" : "Trophy Case"}
              </span>
            </h3>
            {/* Comparison Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {achievements.map((ach) => {
                const isUnlocked = !!ach.unlockedAt;
                const rarityColors = {
                  common: "border-neon-green/20 bg-neon-green/5",
                  rare: "border-neon-blue/20 bg-neon-blue/5",
                  legendary: "border-neon-gold/20 bg-neon-gold/5",
                };
                const rarityGlow = {
                  common: "",
                  rare: isUnlocked
                    ? "shadow-[0_0_15px_rgba(77,124,255,0.15)]"
                    : "",
                  legendary: isUnlocked
                    ? "shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                    : "",
                };
                return (
                  <div
                    key={ach.id}
                    className={`p-4 rounded-2xl border transition-all duration-500 flex flex-col items-center text-center gap-3 group relative overflow-hidden ${
                      isUnlocked
                        ? `${rarityColors[ach.rarity]} ${
                          rarityGlow[ach.rarity]
                        } hover:scale-105`
                        : "border-white/5 bg-surface-2/30 opacity-40 grayscale"
                    }`}
                  >
                    <div
                      className={`text-3xl transition-transform duration-300 flex items-center justify-center ${
                        isUnlocked
                          ? "group-hover:scale-125 group-hover:rotate-12"
                          : ""
                      }`}
                    >
                      {(() => {
                        switch (ach.icon) {
                          case "sword":
                            return <Swords size={32} />;
                          case "flame":
                            return <Flame size={32} />;
                          case "moon":
                            return <Moon size={32} />;
                          case "book":
                            return <BookOpen size={32} />;
                          case "zap":
                            return <Zap size={32} />;
                          case "gem":
                            return <Gem size={32} />;
                          case "crosshair":
                            return <Crosshair size={32} />;
                          case "timer":
                            return <Timer size={32} />;
                          default:
                            return <span>{ach.icon}</span>; // Fallback for old emojis
                        }
                      })()}
                    </div>
                    <div>
                      <div
                        className={`text-xs font-black uppercase tracking-wide font-display ${
                          isUnlocked ? "text-text-main" : "text-text-muted/40"
                        }`}
                      >
                        {language === "id" ? ach.title : ach.titleEn}
                      </div>
                      <div className="text-[10px] text-text-muted/60 mt-1">
                        {language === "id"
                          ? ach.description
                          : ach.descriptionEn}
                      </div>
                    </div>
                    {isUnlocked && (
                      <div className="text-[8px] font-black uppercase tracking-widest text-neon-gold/60 font-display">
                        {new Date(ach.unlockedAt!).toLocaleDateString(
                          language === "id" ? "id-ID" : "en-US",
                          { month: "short", day: "numeric" },
                        )}
                      </div>
                    )}
                    {!isUnlocked && (
                      <div className="text-[8px] font-black text-text-muted/30 uppercase tracking-widest font-display flex items-center justify-center gap-1">
                        <Lock size={8} /> Locked
                      </div>
                    )}
                    {isUnlocked && ach.rarity === "legendary" && (
                      <div className="absolute inset-0 bg-linear-to-t from-neon-gold/5 to-transparent pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity Monitor (Heatmap) */}
        <div className="lg:col-span-3 order-6">
          <div className="game-panel p-8 flex flex-col gap-6">
            <h3 className="text-lg font-black flex items-center gap-3 tracking-tight font-display">
              <div className="p-2 bg-neon-green/10 rounded-xl border border-neon-green/20">
                <CalendarDays size={20} className="text-neon-green" />
              </div>
              <span className="neon-green-text uppercase tracking-widest">
                {t.profile.activityMonitor}
              </span>
            </h3>

            <div className="flex flex-col gap-4">
              <div className="overflow-x-auto overflow-y-hidden custom-scrollbar pb-4 pt-2">
                <div className="flex gap-[6px] min-w-max px-2 justify-center">
                  {/* Generate 5 weeks (approx 1 month) */}
                  {Array.from({ length: 5 }).map((_, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-[3px]">
                      {Array.from({ length: 7 }).map((_, dayIdx) => {
                        const date = new Date();
                        const daysAgo = (51 - weekIdx) * 7 + (6 - dayIdx);
                        date.setDate(date.getDate() - daysAgo);
                        const dateStr = date.toISOString().split("T")[0];

                        const daySessions = sessions.filter((s: StudySession) =>
                          s.date.startsWith(dateStr)
                        );
                        const totalMins = daySessions.reduce(
                          (acc: number, s: StudySession) =>
                            acc + s.durationMinutes,
                          0,
                        );

                        const level = totalMins === 0
                          ? 0
                          : totalMins < 30
                          ? 1
                          : totalMins < 60
                          ? 2
                          : totalMins < 120
                          ? 3
                          : 4;

                        const colors = [
                          "rgba(255, 255, 255, 0.05)",
                          "rgba(57, 255, 20, 0.2)",
                          "rgba(57, 255, 20, 0.4)",
                          "rgba(57, 255, 20, 0.7)",
                          "rgba(57, 255, 20, 1)",
                        ];

                        return (
                          <div
                            key={dayIdx}
                            className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px] rounded-[3px] transition-all hover:ring-2 hover:ring-neon-cyan cursor-help"
                            style={{
                              backgroundColor: colors[level],
                            }}
                            title={`${dateStr}: ${totalMins} mins`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-black uppercase tracking-widest text-text-muted/40 font-display mt-2">
                <div className="flex gap-4">
                  <span>{language === "id" ? "Bulan Terakhir" : "Last Month"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Less</span>
                  <div className="flex gap-[3px]">
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-white/5"></div>
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-[rgba(57,255,20,0.2)]"></div>
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-[rgba(57,255,20,0.4)]"></div>
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-[rgba(57,255,20,0.7)]"></div>
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-[rgba(57,255,20,1)]"></div>
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Semester Button at Bottom */}
      {activeSemester && (
        <div className="flex justify-center mt-12 pb-12">
          <button
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-neon-red/10 animate-in fade-in slide-in-from-bottom-4 duration-500 border border-neon-red/20 text-neon-red hover:bg-neon-red/20 transition-all group font-display"
            onClick={() => deleteSemester(activeSemester.id)}
          >
            <Trash2
              size={20}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="font-black uppercase tracking-widest text-xs">
              {t.profile.deleteSemester}
            </span>
          </button>
        </div>
      )}

      {/* Add Semester Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="game-panel p-8 max-w-md w-full flex flex-col gap-8 border-neon-cyan/20">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tight font-display neon-cyan-text">
                {t.profile.addSemester}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-neon-cyan/10 rounded-full text-text-muted/40 hover:text-neon-cyan transition-all cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">
                  {t.profile.semesterNumber}
                </label>
                <input
                  type="number"
                  className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all font-mono"
                  value={form.number}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      number: parseInt(e.target.value),
                    }))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">
                  {t.profile.academicYear}
                </label>
                <input
                  type="text"
                  className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all"
                  placeholder="e.g. 2023/2024"
                  value={form.year}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, year: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">
                    {t.profile.semesterType}
                  </label>
                  <select
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all appearance-none cursor-pointer"
                    value={form.type}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        type: e.target.value as SemesterType,
                      }))}
                  >
                    <option value="ganjil" className="bg-bg-main">
                      {t.profile.ganjil}
                    </option>
                    <option value="genap" className="bg-bg-main">
                      {t.profile.genap}
                    </option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">
                    {t.profile.totalSks}
                  </label>
                  <input
                    type="number"
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all"
                    value={form.totalSks}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        totalSks: parseInt(e.target.value) || 0,
                      }))}
                  />
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary h-16 w-full text-lg mt-2 font-display"
              onClick={handleAddSemester}
            >
              {t.profile.addSemester}
            </button>
          </div>
        </div>
      )}
      {/* Full Activity Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-150 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="game-panel p-8 max-w-2xl w-full flex flex-col gap-8 border-neon-cyan/20 max-h-[85vh] shadow-[0_0_80px_rgba(0,240,255,0.05)]">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-neon-cyan/10 rounded-2xl border border-neon-cyan/20">
                  <History size={24} className="text-neon-cyan" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight font-display neon-cyan-text uppercase">
                    {t.profile.activityLogTitle}
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/40 mt-1">
                    {t.profile.activityLogSubtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-3 hover:bg-neon-cyan/10 rounded-full text-text-muted/40 hover:text-neon-cyan transition-all cursor-pointer border border-transparent hover:border-neon-cyan/20"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
              {xpLogs.length === 0
                ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-20 opacity-20 italic">
                    <Shield size={40} />
                    <p className="font-bold uppercase tracking-widest text-xs">
                      {t.profile.noRecords}
                    </p>
                  </div>
                )
                : (
                  [...xpLogs].reverse().map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-5 rounded-2xl bg-surface-2/40 border border-white/5 hover:border-neon-cyan/30 transition-all duration-300 group/logitem"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-muted/40 group-hover/logitem:text-neon-cyan group-hover/logitem:bg-neon-cyan/5 transition-all">
                          {log.source.includes("Streak")
                            ? <Zap size={18} />
                            : log.source.includes("Mastery")
                            ? <Trophy size={18} />
                            : log.source.includes("Training")
                            ? <Swords size={18} />
                            : <Shield size={18} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-text-main group-hover/logitem:text-neon-cyan transition-colors">
                            {log.source}
                          </span>
                          <span className="text-[10px] font-bold text-text-muted/40 font-mono mt-0.5">
                            {new Date(log.date).toLocaleDateString(undefined, {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })} - {new Date(log.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-lg font-black text-neon-gold tabular-nums">
                          +{log.amount}
                        </div>
                        <div className="text-[8px] font-black text-neon-gold/40 uppercase tracking-widest">
                          {t.profile.expPoints}
                        </div>
                      </div>
                    </div>
                  ))
                )}
            </div>

            <div className="p-5 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info size={16} className="text-neon-cyan/60" />
                <span className="text-[10px] font-bold text-text-muted/60 uppercase tracking-wide">
                  {t.profile.totalAccumulation}
                </span>
              </div>
              <div className="text-xl font-black text-neon-cyan tabular-nums">
                {xp} XP
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
