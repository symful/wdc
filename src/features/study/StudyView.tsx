import { useEffect } from "react";
import { useStudyStore } from "../../store/useStudyStore";
import {
  AcademicCourse,
  StudyTopic,
  useAcademicStore,
} from "../../store/useAcademicStore";
import { translations, useLanguageStore } from "../../store/useLanguageStore";
import {
  BarChart3,
  BrainCircuit,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  FastForward,
  GraduationCap,
  Pause,
  Play,
  Search,
  Sparkles,
  Square,
  Target,
  Timer as TimerIcon,
  X,
  Zap,
} from "lucide-react";
import { useUIStore } from "../../store/useUIStore";
import { useStudyViewStore } from "../../store/useStudyViewStore";

import { FloatingActionButton } from "../../components/ui/FloatingActionButton";

export function StudyView() {
  const {
    sessions,
    activeSession,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    cancelSession,
  } = useStudyStore();
  const {
    semesters,
    courses,
    activeSemesterId,
    studyPlan,
    updateTopic,
    skipTask,
    addXp,
    generateStudyPlan,
  } = useAcademicStore();
  const { language } = useLanguageStore();
  const t = translations[language];

  const {
    studyModals,
    setStudyModal,
    generationState,
    setGenerationState,
    resetGenerationState,
  } = useUIStore();

  const {
    timerState,
    suggestions,
    setTimerState,
    setSuggestions,
  } = useStudyViewStore();

  const activeSemester = semesters.find((s) => s.id === activeSemesterId);
  const filteredCourses = courses.filter((c) =>
    c.semesterId === activeSemesterId
  );

  const steps = [
    { title: t.dashboard.analyzing, icon: <CalendarRange size={20} /> },
    { title: t.dashboard.prioritizing, icon: <BarChart3 size={20} /> },
    { title: t.dashboard.developing, icon: <Search size={20} /> },
  ];

  const handleGenerate = () => {
    setGenerationState({ isActive: true, step: 0, completed: false });

    // Simulate steps
    const timers = [
      setTimeout(() => setGenerationState({ step: 1 }), 1000),
      setTimeout(() => setGenerationState({ step: 2 }), 2000),
      setTimeout(() => setGenerationState({ step: 3, completed: true }), 3000),
      setTimeout(() => {
        setGenerationState({ isExiting: true });
        generateStudyPlan(sessions);
        setTimeout(() => {
          resetGenerationState();
        }, 600); // Time for fade out
      }, 4500),
    ];

    const cleanup = () => timers.forEach(clearTimeout);
    return cleanup;
  };


  // HUD system ID from store
  const { systemId } = timerState;

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeSession.startTime && !activeSession.pauseTime) {
      interval = setInterval(() => {
        const totalElapsed = Math.floor(
          (Date.now() - activeSession.startTime! -
            activeSession.totalPausedTime) / 1000,
        );
        setTimerState((s) => ({ ...s, elapsed: totalElapsed }));
      }, 1000);
    } else if (activeSession.pauseTime) {
      // Keep showing the elapsed time at the moment of pause
      const totalElapsed = Math.floor(
        (activeSession.pauseTime - activeSession.startTime! -
          activeSession.totalPausedTime) / 1000,
      );
      setTimerState((s) => ({ ...s, elapsed: totalElapsed }));
    } else {
      setTimerState((s) => ({ ...s, elapsed: 0 }));
    }
    return () => clearInterval(interval);
  }, [
    activeSession.startTime,
    activeSession.pauseTime,
    activeSession.totalPausedTime,
    setTimerState,
  ]);

  const handleStart = () => {
    if (!timerState.courseId || !timerState.topicTitle) return;
    setTimerState((s) => ({ ...s, elapsed: 0 }));
    startSession(timerState.courseId, timerState.topicTitle);
  };

  const handleEnd = (confidence: number) => {
    const course = courses.find((c) => c.id === activeSession.courseId);
    if (course) {
      const topic = course.topics.find((t) => t.title === activeSession.topic);
      if (topic) {
        updateTopic(course.id, topic.id, {
          confidence: Math.round((topic.confidence + confidence) / 2),
          repetitionCount: topic.repetitionCount + 1,
          completed: confidence >= 4,
        });

        // Add XP based on confidence
        const xpAmount = confidence * 20;
        addXp(xpAmount, `Mastery Level: ${confidence}/5`);
      } else {
        // Custom topic XP
        addXp(confidence * 15, `Custom Training: ${activeSession.topic}`);
      }
    }

    endSession(confidence);
    setStudyModal("confidenceModal", false);
    setTimerState((s) => ({ ...s, topicTitle: "", isCustomTopic: false }));
  };

  const handleSkipSession = () => {
    if (!activeSession.courseId || !activeSession.topic) return;

    const currentCourseId = activeSession.courseId;
    const currentTopic = activeSession.topic;

    // 0. Reset local timer immediately
    setTimerState((s) => ({ ...s, elapsed: 0 }));

    // 1. Cancel session in store
    cancelSession();

    // 2. Remove from plan
    skipTask(currentCourseId, currentTopic);

    // 3. Proactively start next one if it was a plan mission
    const remainingPlan = studyPlan.filter((p) =>
      !(p.courseId === currentCourseId && p.topicTitle === currentTopic)
    );
    if (remainingPlan.length > 0) {
      const nextPlan = remainingPlan[0];
      setTimerState((s) => ({
        ...s,
        courseId: nextPlan.courseId,
        topicTitle: nextPlan.topicTitle,
      }));
      startSession(nextPlan.courseId, nextPlan.topicTitle);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${
      s.toString().padStart(2, "0")
    }`;
  };

  // Tree gradient logic
  const getCourseIntensity = (course: AcademicCourse) => {
    const studyMins = sessions
      .filter((s) => s.courseId === course.id)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    const targetMins = course.sks * 60; // 1 SKS = 1h independent/week as a baseline
    return studyMins / (targetMins || 60);
  };

  const getTopicIntensity = (topic: StudyTopic) => {
    return topic.repetitionCount / 5; // Target 5 repetitions for mastery
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-10 sm:pb-0">
      <FloatingActionButton
        mainIcon={<BrainCircuit size={24} />}
        onClick={() => setStudyModal("showTreeModal", true)}
      />

      <div className="flex items-center justify-between flex-wrap gap-6 pt-4 sm:pt-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 neon-glow-text font-display uppercase">
            {t.study.title}
          </h1>
          <p className="text-text-muted text-base sm:text-lg max-w-2xl">
            {t.study.subtitle}
          </p>
        </div>
        <button
          className="hidden sm:flex btn btn-glass px-8 h-14 rounded-2xl font-black uppercase tracking-widest gap-3 hover:scale-105 active:scale-95 transition-all group"
          onClick={() => setStudyModal("showTreeModal", true)}
        >
          <BrainCircuit
            size={20}
            className="text-neon-cyan group-hover:rotate-12 transition-transform"
          />
          {t.study.viewSkillTree}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Study Plan Status & Mission Start */}
        <div className="lg:col-span-3 game-panel p-8 border-neon-cyan/20 flex flex-col gap-6 bg-linear-to-br from-neon-cyan/5 to-transparent relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <Target size={120} />
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black font-display uppercase tracking-widest text-neon-cyan flex items-center gap-3">
              <Sparkles size={20} />
              {t.dashboard.todayStudyPlan}
            </h3>
            <div className="px-3 py-1 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-[10px] font-black text-neon-cyan uppercase">
              {studyPlan.length} {t.dashboard.missionsPending}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {studyPlan.length === 0
              ? (
                <div className="py-12 flex flex-col items-center justify-center gap-6 text-text-muted/20 italic text-center">
                  <div className="flex flex-col items-center gap-4">
                    <ClipboardList size={40} />
                    <p className="font-bold tracking-widest uppercase text-xs">
                      {t.dashboard.noStudyPlan}
                    </p>
                  </div>

                  <button
                    onClick={handleGenerate}
                    className="btn btn-primary px-8 h-12 rounded-xl font-black uppercase tracking-widest flex items-center gap-3 shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:scale-105 transition-all"
                  >
                    <Sparkles size={16} />
                    {t.dashboard.generateStudyPlan}
                  </button>

                  <div className="text-[9px] uppercase font-black opacity-50 max-w-45 mt-2">
                    {t.dashboard.generatePrompt}
                  </div>
                </div>
              )
              : (
                studyPlan.map((plan, idx) => {
                  const course = courses.find((c) => c.id === plan.courseId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-5 bg-surface-2/60 border border-neon-cyan/10 rounded-2xl group/item hover:border-neon-cyan/30 transition-all duration-300"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-neon-cyan/50 uppercase tracking-widest">
                          {course?.name}
                        </span>
                        <span className="font-bold text-sm text-text-main uppercase">
                          {plan.topicTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Duration Badge on the Right */}
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-[10px] font-black text-text-muted/60 uppercase border border-white/5">
                          <TimerIcon size={11} /> {plan.allocatedMinutes}m
                        </div>

                        {activeSession.startTime &&
                          activeSession.topic === plan.topicTitle && (
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-1 h-3 bg-neon-cyan animate-bounce [animation-delay:-0.2s]">
                              </div>
                              <div className="w-1 h-3 bg-neon-cyan animate-bounce [animation-delay:-0.1s]">
                              </div>
                              <div className="w-1 h-3 bg-neon-cyan animate-bounce">
                              </div>
                            </div>
                            <span className="text-[9px] font-black text-neon-cyan animate-pulse uppercase">
                              Active
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
          </div>

          {studyPlan.length > 0 && !activeSession.startTime && (
            <button
              className="mt-4 btn btn-primary h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,240,255,0.2)] hover:scale-105 transition-all"
              onClick={() => {
                const firstPlan = studyPlan[0];
                setTimerState((s) => ({
                  ...s,
                  courseId: firstPlan.courseId,
                  topicTitle: firstPlan.topicTitle,
                }));
                startSession(firstPlan.courseId, firstPlan.topicTitle);
              }}
            >
              <Play size={20} fill="currentColor" />
              {t.study.startStudySession}
            </button>
          )}

          {activeSession.startTime && (
            <div className="mt-4 game-panel p-6 bg-neon-cyan/10 border-neon-cyan/30 flex flex-col items-center gap-6 animate-in zoom-in duration-500">
              <div className="flex flex-col items-center gap-2">
                <div className="text-5xl font-black font-mono tracking-tighter neon-cyan-text tabular-nums">
                  {formatTime(timerState.elapsed)}
                </div>
                {activeSession.pauseTime && (
                  <div className="px-3 py-1 rounded bg-neon-gold/20 text-neon-gold text-[10px] font-black uppercase tracking-widest animate-pulse font-display">
                    Paused
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 flex-wrap justify-center">
                {activeSession.pauseTime
                  ? (
                    <button
                      className="btn btn-primary px-8 h-12 rounded-xl font-black flex items-center gap-3 transition-all uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                      onClick={resumeSession}
                    >
                      <Play size={14} fill="currentColor" />{" "}
                      {language === "id" ? "Lanjut" : "Resume"}
                    </button>
                  )
                  : (
                    <button
                      className="btn btn-glass px-8 h-12 rounded-xl font-black flex items-center gap-3 transition-all uppercase text-[10px] tracking-widest hover:border-neon-gold/50"
                      onClick={pauseSession}
                    >
                      <Pause size={14} fill="currentColor" />{" "}
                      {language === "id" ? "Jeda" : "Pause"}
                    </button>
                  )}

                {studyPlan.some((p) =>
                  p.courseId === activeSession.courseId &&
                  p.topicTitle === activeSession.topic
                ) && (
                  <button
                    className="btn btn-glass px-6 h-12 rounded-xl font-black flex items-center gap-3 transition-all uppercase text-[10px] tracking-widest hover:border-neon-red/50 hover:text-neon-red shadow-[0_0_15px_rgba(255,49,49,0.1)]"
                    onClick={handleSkipSession}
                    title="Next Topic"
                  >
                    <FastForward size={14} fill="currentColor" />{" "}
                    {language === "id" ? "Lewati" : "Skip"}
                  </button>
                )}

                <button
                  className="btn bg-neon-red/80 hover:bg-neon-red text-white px-8 h-12 rounded-xl font-black flex items-center gap-3 transition-all duration-300 shadow-[0_0_20px_rgba(255,49,49,0.2)] uppercase text-[10px] tracking-widest"
                  onClick={() => setStudyModal("confidenceModal", true)}
                >
                  <Square size={14} fill="currentColor" />{" "}
                  {language === "id" ? "Selesai" : "Finish"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Manual Entrance Card */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="game-panel p-8 border-neon-gold/20 flex flex-col gap-8 bg-linear-to-br from-neon-gold/5 to-transparent">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-neon-gold font-display flex items-center gap-3">
              <Zap size={18} className="animate-pulse" />
              {t.study.manualSession}
            </h4>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest px-1">
                    Select Course
                  </label>
                  <select
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/20 rounded-2xl px-5 text-sm font-bold appearance-none cursor-pointer focus:border-neon-cyan transition-colors"
                    value={timerState.courseId}
                    onChange={(e) => {
                      setTimerState((s) => ({
                        ...s,
                        courseId: e.target.value,
                        topicTitle: "",
                        isCustomTopic: false,
                      }));
                      setSuggestions([]);
                    }}
                    disabled={!!activeSession.startTime}
                  >
                    <option value="">-- COURSE ARCHIVES --</option>
                    {filteredCourses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2 relative">
                  <label className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest px-1">
                    Training Objective
                  </label>
                  <input
                    type="text"
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/20 rounded-2xl px-5 text-sm font-bold placeholder:text-text-muted/20 focus:border-neon-cyan transition-colors outline-none"
                    placeholder="Enter topic..."
                    value={timerState.topicTitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTimerState((s) => ({ ...s, topicTitle: val }));

                      if (timerState.courseId) {
                        const course = courses.find((c) =>
                          c.id === timerState.courseId
                        );
                        if (course) {
                          const filtered = val.length > 0
                            ? course.topics.map((t) => t.title).filter((t) =>
                              t.toLowerCase().includes(val.toLowerCase())
                            )
                            : course.topics.map((t) => t.title);
                          setSuggestions(filtered);
                          setStudyModal("showSuggestions", filtered.length > 0);
                        }
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow clicking a suggestion
                      setTimeout(
                        () => setStudyModal("showSuggestions", false),
                        200,
                      );
                    }}
                    onFocus={() => {
                      if (timerState.courseId) {
                        const course = courses.find((c) =>
                          c.id === timerState.courseId
                        );
                        if (course) {
                          const val = timerState.topicTitle;
                          const filtered = val.length > 0
                            ? course.topics.map((t) => t.title).filter((t) =>
                              t.toLowerCase().includes(val.toLowerCase())
                            )
                            : course.topics.map((t) => t.title);
                          setSuggestions(filtered);
                          setStudyModal("showSuggestions", filtered.length > 0);
                        }
                      }
                    }}
                    disabled={!timerState.courseId || !!activeSession.startTime}
                  />

                  {/* Suggestions Dropdown */}
                  {studyModals.showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 bg-bg-main border border-neon-cyan/30 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          className="px-5 py-4 text-xs font-bold text-text-muted hover:text-neon-cyan hover:bg-neon-cyan/10 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                          onClick={() => {
                            setTimerState((prev) => ({
                              ...prev,
                              topicTitle: s,
                            }));
                            setStudyModal("showSuggestions", false);
                          }}
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!activeSession.startTime
                  ? (
                    <button
                      className={`btn h-16 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 mt-4
                        ${
                        (!timerState.courseId || !timerState.topicTitle)
                          ? "bg-surface-2 text-text-muted/20 border border-white/5"
                          : "btn-primary shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:scale-[1.02]"
                      }`}
                      onClick={handleStart}
                      disabled={!timerState.courseId || !timerState.topicTitle}
                    >
                      <Play size={20} fill="currentColor" />{" "}
                      {t.study.manualSession}
                    </button>
                  )
                  : (
                    <button
                      className="btn h-16 rounded-2xl font-black uppercase tracking-widest bg-surface-2/50 text-neon-cyan/50 cursor-not-allowed mt-4 flex items-center justify-center gap-3 border border-neon-cyan/10 transition-all duration-300"
                      disabled
                    >
                      <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse">
                      </div>
                      Session in Progress
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Power Level Assessment Modal */}
      {studyModals.confidenceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-200 flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="game-panel p-10 flex flex-col items-center gap-10 max-w-lg w-full border-neon-cyan/20 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
            <div className="text-center">
              <div className="w-24 h-24 bg-neon-cyan/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-neon-cyan/20 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                <CheckCircle2 size={48} className="text-neon-cyan" />
              </div>
              <h3 className="text-3xl font-black mb-3 tracking-tight font-display neon-cyan-text uppercase">
                {t.study.trainingComplete}
              </h3>
              <p className="text-text-muted text-lg font-medium opacity-80">
                {t.study.ratePowerLevel}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  className="w-16 h-16 rounded-2xl bg-surface-2 hover:bg-neon-cyan text-xl font-black transition-all duration-300 transform hover:scale-110 active:scale-95 hover:shadow-glow border border-neon-cyan/10 hover:border-neon-cyan group cursor-pointer font-display"
                  onClick={() => handleEnd(rating)}
                >
                  <span className="group-hover:scale-125 transition-transform inline-block group-hover:text-bg-main">
                    {rating}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-[10px] uppercase font-black tracking-widest text-text-muted/40 font-display">
              Level 1 ({t.study.weak}) - Level 5 ({t.study.mastered})
            </p>
          </div>
        </div>
      )}

      {/* Skill Tree Visualizer Modal */}
      {studyModals.showTreeModal && (
        <div className="fixed inset-0 bg-bg-main/95 backdrop-blur-2xl z-200 flex items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-hidden">
          <div className="game-panel p-10 max-w-6xl w-full border-neon-cyan/20 overflow-y-auto max-h-[90vh] shadow-[0_40px_100px_rgba(0,0,0,0.1)] relative bg-surface-1/80 custom-scrollbar">
            <button
              className="absolute top-8 right-8 p-3 hover:bg-neon-cyan/10 rounded-full border border-transparent hover:border-neon-cyan/20 transition-all hover:scale-110 active:scale-90 cursor-pointer text-text-muted/40 hover:text-neon-cyan"
              onClick={() => setStudyModal("showTreeModal", false)}
            >
              <X size={24} />
            </button>

            <div className="flex flex-col items-center gap-12 text-center mb-16">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-neon-cyan/10 rounded-3xl border border-neon-cyan/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                  <GraduationCap size={32} className="text-neon-cyan" />
                </div>
                <h3 className="text-4xl font-black tracking-tighter font-display uppercase neon-glow-text mb-2">
                  {activeSemester
                    ? `${t.profile.semester} ${activeSemester.number}`
                    : "No Active Semester"}
                </h3>
                <p className="text-xs font-black tracking-[0.3em] text-text-muted/40 uppercase font-display">
                  {activeSemester?.year} - {activeSemester?.type}
                </p>
              </div>
            </div>

            {/* Tree Visualization */}
            <div className="flex flex-col gap-16 relative">
              {filteredCourses.length === 0
                ? (
                  <div className="py-20 text-center text-text-muted/30 font-bold italic">
                    No academic courses found for this semester.
                  </div>
                )
                : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12 items-start">
                    {filteredCourses.map((course) => {
                      const intensity = getCourseIntensity(course);
                      return (
                        <div
                          key={course.id}
                          className="flex flex-col gap-6 group"
                        >
                          {/* Course Node */}
                          <div className="relative flex flex-col items-center">
                            <div
                              className="w-full p-6 rounded-3xl border transition-all duration-700 relative z-10 overflow-hidden bg-surface-2 group-hover:bg-surface-2/95"
                              style={{
                                borderColor: `var(--color-neon-cyan)`,
                                opacity: 0.2 + intensity * 0.8,
                                boxShadow: intensity > 0.5
                                  ? `0 10px 30px -10px var(--color-neon-cyan)`
                                  : "none",
                              }}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black text-neon-cyan/60 font-mono tracking-widest">
                                  {course.code}
                                </span>
                                <div className="flex flex-col items-end gap-1">
                                  <div className="px-2 py-0.5 rounded bg-neon-cyan/10 text-[8px] font-black text-neon-cyan border border-neon-cyan/20">
                                    {course.sks} SKS
                                  </div>
                                  <div
                                    className={`text-[10px] font-bold ${
                                      intensity >= 1
                                        ? "text-neon-cyan"
                                        : "text-text-muted/40"
                                    }`}
                                  >
                                    {Math.round(intensity * 100)}%
                                  </div>
                                </div>
                              </div>
                              <h4 className="text-xl font-black tracking-tight mb-2 group-hover:text-neon-cyan transition-colors">
                                {course.name}
                              </h4>
                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-4">
                                <div
                                  className="h-full bg-neon-cyan transition-all duration-1000"
                                  style={{
                                    width: `${Math.min(intensity * 100, 100)}%`,
                                  }}
                                >
                                </div>
                              </div>
                            </div>

                            {/* Branch Line */}
                            {course.topics.length > 0 && (
                              <div className="w-0.5 h-12 bg-linear-to-b from-neon-cyan/20 to-transparent">
                              </div>
                            )}
                          </div>

                          {/* Topic Leaves */}
                          <div className="flex flex-wrap justify-center gap-3">
                            {course.topics.map((topic) => {
                              const tIntensity = getTopicIntensity(topic);
                              const tPercent = Math.round(tIntensity * 100);
                              return (
                                <div
                                  key={topic.id}
                                  className="px-4 py-2 rounded-xl border text-[11px] font-bold transition-all duration-500 hover:scale-110 cursor-default flex items-center gap-2"
                                  style={{
                                    borderColor: `var(--color-neon-purple)`,
                                    background: tIntensity > 0
                                      ? "var(--color-neon-purple)"
                                      : "transparent",
                                    backgroundColor: `rgba(147, 51, 234, ${
                                      0.1 + Math.min(tIntensity, 1) * 0.2
                                    })`,
                                    color: "var(--text-main)",
                                    boxShadow: tIntensity > 0.7
                                      ? `0 4px 12px rgba(147, 51, 234, 0.2)`
                                      : "none",
                                  }}
                                >
                                  <span>{topic.title}</span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded bg-white/5 ${
                                      tPercent >= 100
                                        ? "text-neon-cyan"
                                        : "text-text-muted/40"
                                    }`}
                                  >
                                    {tPercent}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Generation Overlay */}
      {generationState.isActive && (
        <div
          className={`fixed inset-0 z-250 bg-bg-main/90 backdrop-blur-xl flex items-center justify-center p-6 transition-all duration-700 ease-in-out ${
            generationState.isExiting
              ? "opacity-0 scale-105 pointer-events-none"
              : "opacity-100 scale-100"
          }`}
        >
          <div
            className={`game-panel p-10 max-w-md w-full border-neon-cyan/20 flex flex-col gap-8 shadow-[0_0_50px_rgba(0,240,255,0.1)] relative overflow-hidden transition-all duration-700 transform ${
              generationState.isExiting
                ? "scale-90 opacity-0 blur-sm"
                : "scale-100 opacity-100"
            }`}
          >
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute inset-0 bg-linear-to-b from-neon-cyan/10 to-transparent animate-scan-line h-1/2">
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                {generationState.completed
                  ? (
                    <CheckCircle2
                      size={32}
                      className="text-neon-green animate-in zoom-in duration-500"
                    />
                  )
                  : (
                    <Sparkles
                      size={32}
                      className="text-neon-cyan animate-pulse"
                    />
                  )}
              </div>
              <h3 className="text-2xl font-black tracking-tight font-display neon-glow-text uppercase">
                {generationState.completed
                  ? (language === "id" ? "Selesai" : "Completed")
                  : t.dashboard.generatingPlan}
              </h3>
            </div>

            <div className="flex flex-col gap-6 relative z-10">
              {steps.map((s, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-4 transition-all duration-500 ${
                    generationState.step >= idx
                      ? "opacity-100 translate-x-0"
                      : "opacity-20 translate-x-4"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg border transition-all duration-300 ${
                      generationState.step > idx
                        ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
                        : generationState.step === idx
                        ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan animate-pulse"
                        : "bg-surface-2 border-white/5 text-text-muted/40"
                    }`}
                  >
                    {generationState.step > idx
                      ? <CheckCircle2 size={20} />
                      : s.icon}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-bold transition-colors ${
                        generationState.step === idx
                          ? "text-text-main"
                          : generationState.step > idx
                          ? "text-text-muted/60"
                          : "text-text-muted/20"
                      }`}
                    >
                      {s.title}
                    </span>
                    {generationState.step === idx &&
                      !generationState.completed && (
                      <div className="w-32 h-0.5 bg-neon-cyan/20 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-neon-cyan animate-pixel-shimmer w-full">
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div
                className={`flex items-center gap-4 transition-all duration-500 ${
                  generationState.completed
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-4"
                }`}
              >
                <div className="p-2 rounded-lg border bg-neon-green/10 border-neon-green/30 text-neon-green">
                  <CheckCircle2 size={20} />
                </div>
                <span className="text-sm font-black text-neon-green uppercase tracking-widest font-display">
                  {language === "id" ? "Selesai" : "Completed"}
                </span>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-surface-2/50 border border-neon-cyan/5 text-[9px] font-mono text-text-muted/40 uppercase tracking-[0.2em] relative z-10 text-center">
              System initialization... 0x{systemId}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
