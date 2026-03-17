import { useState } from 'react';
import { useAcademicStore, AcademicCourse, CourseType } from '../../store/useAcademicStore';
import { useLanguageStore, translations } from '../../store/useLanguageStore';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  BookOpen, 
  Clock, 
  MapPin, 
  User as UserIcon,
  X,
  Code,
  Layers,
  CheckCircle2
} from 'lucide-react';

export function StudyManagerView() {
  const { 
    semesters, 
    courses, 
    activeSemesterId, 
    addCourse, 
    updateCourse, 
    deleteCourse 
  } = useAcademicStore();
  const { language } = useLanguageStore();
  const t = translations[language];

  const activeSemester = semesters.find(s => s.id === activeSemesterId);
  const filteredCourses = courses.filter(c => c.semesterId === activeSemesterId);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<AcademicCourse, 'id' | 'semesterId'>>({
    name: '',
    code: '',
    sks: 3,
    type: 'Wajib',
    schedules: [{
      day: 0,
      startTime: '08:00',
      endTime: '10:00',
      room: '',
      lecturer: ''
    }],
    topics: []
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      name: '',
      code: '',
      sks: 3,
      type: 'Wajib',
      schedules: [{
        day: 0,
        startTime: '08:00',
        endTime: '10:00',
        room: '',
        lecturer: ''
      }],
      topics: []
    });
    setShowModal(true);
  };

  const handleOpenEdit = (course: AcademicCourse) => {
    setEditingId(course.id);
    setForm({
      name: course.name,
      code: course.code,
      sks: course.sks,
      type: course.type,
      schedules: course.schedules,
      topics: course.topics
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!activeSemesterId) return;
    if (editingId) {
      updateCourse(editingId, form);
    } else {
      addCourse({ ...form, semesterId: activeSemesterId });
    }
    setShowModal(false);
  };

  const addScheduleField = () => {
    setForm(s => ({
      ...s,
      schedules: [...s.schedules, { day: 0, startTime: '08:00', endTime: '10:00', room: '', lecturer: '' }]
    }));
  };

  const removeScheduleField = (index: number) => {
    setForm(s => ({
      ...s,
      schedules: s.schedules.filter((_, i) => i !== index)
    }));
  };

  const updateScheduleField = (index: number, updates: any) => {
    setForm(s => ({
      ...s,
      schedules: s.schedules.map((sch, i) => i === index ? { ...sch, ...updates } : sch)
    }));
  };

  const getDayName = (dayIndex: number) => {
    const days = t.academic.days || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    return days[dayIndex];
  };

  if (!activeSemesterId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="p-6 bg-surface-2 rounded-full border border-neon-cyan/10">
          <BookOpen size={48} className="text-text-muted/20" />
        </div>
        <p className="text-text-muted text-lg font-bold italic">{t.profile.noSemester}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 neon-glow-text font-display uppercase">{t.academic.title}</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-text-muted text-lg max-w-2xl">{t.academic.subtitle}</p>
            {activeSemester && (
              <div className="px-4 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan">{t.profile.semester} {activeSemester.number}</span>
                <div className="w-1 h-1 rounded-full bg-neon-cyan/30"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">{activeSemester.year} - {activeSemester.type === 'ganjil' ? t.profile.ganjil : t.profile.genap}</span>
              </div>
            )}
          </div>
        </div>
        <button 
          className="btn btn-primary px-8 h-14 rounded-2xl font-black uppercase tracking-widest gap-3 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
          onClick={handleOpenAdd}
        >
          <Plus size={20} /> {t.academic.addCourse}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full py-20 bg-surface-2/30 rounded-3xl border border-dashed border-neon-cyan/10 flex flex-col items-center justify-center gap-4">
            <BookOpen size={40} className="text-text-muted/10" />
            <p className="text-text-muted/40 font-bold italic tracking-wide">{t.academic.noCourses}</p>
          </div>
        ) : (
          filteredCourses.map(course => (
            <div key={course.id} className="game-panel p-6 flex flex-col gap-6 group hover:border-neon-cyan/40 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                      course.type === 'Wajib' ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan' :
                      course.type === 'Pilihan' ? 'bg-neon-purple/10 border-neon-purple/30 text-neon-purple' :
                      'bg-neon-red/10 border-neon-red/30 text-neon-red'
                    }`}>
                      {course.type === 'Wajib' ? t.academic.wajib : course.type === 'Pilihan' ? t.academic.pilihan : t.academic.mengulang}
                    </span>
                    <span className="text-[10px] font-bold text-text-muted/60 font-mono">{course.code}</span>
                  </div>
                  <h4 className="text-lg font-black tracking-tight group-hover:text-neon-cyan transition-colors">{course.name}</h4>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="p-2 rounded-lg bg-surface-2 hover:bg-neon-cyan/10 text-text-muted/60 hover:text-neon-cyan transition-all"
                    onClick={() => handleOpenEdit(course)}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    className="p-2 rounded-lg bg-surface-2 hover:bg-neon-red/10 text-text-muted/60 hover:text-neon-red transition-all"
                    onClick={() => deleteCourse(course.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 py-3 border-y border-neon-cyan/10">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest mb-1">{t.academic.sks}</span>
                  <span className="text-sm font-bold">{course.sks} SKS</span>
                </div>
                <div className="w-px h-6 bg-neon-cyan/20"></div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest mb-1">{t.academic.schedule}</span>
                  <span className="text-sm font-bold">{course.schedules.length} Slot</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {course.schedules.map((sch, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 bg-surface-2/60 rounded-xl border border-neon-cyan/10 text-[11px] shadow-sm">
                    <div className="flex justify-between items-center font-bold">
                      <div className="flex items-center gap-2 text-neon-cyan">
                        <Clock size={12} />
                        <span>{getDayName(sch.day)}, {sch.startTime} - {sch.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-muted/80">
                        <MapPin size={12} />
                        <span>{sch.room || 'TBA'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted/60">
                      <UserIcon size={12} />
                      <span className="truncate">{sch.lecturer || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-bg-main/80 backdrop-blur-xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="game-panel p-8 max-w-2xl w-full flex flex-col gap-8 border-neon-cyan/20 overflow-y-auto max-h-[90vh] shadow-[0_20px_60px_rgba(0,0,0,0.15)] bg-surface-1">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tight font-display neon-cyan-text">
                {editingId ? t.academic.editCourse : t.academic.addCourse}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-neon-cyan/10 rounded-full text-text-muted/40 hover:text-neon-cyan transition-all cursor-pointer">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-8">
              {/* General Info */}
              <div className="flex flex-col gap-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-neon-cyan/60 flex items-center gap-2 font-display">
                  <Layers size={14} /> General Info
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2 col-span-full">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">{t.academic.courseName}</label>
                    <input 
                      type="text" 
                      className="w-full h-14 bg-surface-2 border border-neon-cyan/20 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all placeholder:text-text-muted/30"
                      value={form.name}
                      onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))}
                      placeholder="e.g. Pemrograman Web"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">{t.academic.courseCode}</label>
                    <input 
                      type="text" 
                      className="w-full h-14 bg-surface-2 border border-neon-cyan/20 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all font-mono placeholder:text-text-muted/30"
                      value={form.code}
                      onChange={(e) => setForm(s => ({ ...s, code: e.target.value }))}
                      placeholder="e.g. IF123"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">{t.academic.sks}</label>
                    <input 
                      type="number" 
                      className="w-full h-14 bg-surface-2 border border-neon-cyan/20 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all placeholder:text-text-muted/30"
                      value={form.sks}
                      onChange={(e) => setForm(s => ({ ...s, sks: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">{t.academic.type}</label>
                    <select 
                      className="w-full h-14 bg-surface-2 border border-neon-cyan/20 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all appearance-none cursor-pointer"
                      value={form.type}
                      onChange={(e) => setForm(s => ({ ...s, type: e.target.value as CourseType }))}
                    >
                      <option value="Wajib">{t.academic.wajib}</option>
                      <option value="Pilihan">{t.academic.pilihan}</option>
                      <option value="Mengulang">{t.academic.mengulang}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-neon-cyan/60 flex items-center gap-2 font-display">
                    <Clock size={14} /> Schedule
                  </h4>
                  <button 
                    className="p-2 rounded-xl bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    onClick={addScheduleField}
                  >
                    <Plus size={14} /> Add Slot
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {form.schedules.map((sch, index) => (
                    <div key={index} className="p-6 bg-surface-2/30 rounded-3xl border border-neon-cyan/20 flex flex-col gap-6 relative group/slot shadow-sm">
                      {form.schedules.length > 1 && (
                        <button 
                          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-neon-red/20 text-neon-red flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity hover:scale-110 active:scale-95"
                          onClick={() => removeScheduleField(index)}
                        >
                          <X size={14} />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 px-1">{t.academic.day}</label>
                          <select 
                            className="bg-surface-2 border border-neon-cyan/10 rounded-xl px-4 h-11 text-sm font-bold outline-none focus:border-neon-cyan/30 appearance-none cursor-pointer"
                            value={sch.day}
                            onChange={(e) => updateScheduleField(index, { day: parseInt(e.target.value) })}
                          >
                            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((d, i) => (
                              <option key={i} value={i}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 px-1">{t.academic.startTime}</label>
                          <input 
                            type="time" 
                            className="bg-surface-2 border border-neon-cyan/10 rounded-xl px-4 h-11 text-sm font-bold outline-none focus:border-neon-cyan/30"
                            value={sch.startTime}
                            onChange={(e) => updateScheduleField(index, { startTime: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 px-1">{t.academic.endTime}</label>
                          <input 
                            type="time" 
                            className="bg-surface-2 border border-neon-cyan/10 rounded-xl px-4 h-11 text-sm font-bold outline-none focus:border-neon-cyan/30"
                            value={sch.endTime}
                            onChange={(e) => updateScheduleField(index, { endTime: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 px-1">{t.academic.room}</label>
                          <input 
                            type="text" 
                            className="bg-surface-2 border border-neon-cyan/10 rounded-xl px-4 h-11 text-sm font-bold outline-none focus:border-neon-cyan/30 placeholder:text-text-muted/30"
                            value={sch.room}
                            onChange={(e) => updateScheduleField(index, { room: e.target.value })}
                            placeholder="e.g. Lab 1"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 px-1">{t.academic.lecturer}</label>
                          <input 
                            type="text" 
                            className="bg-surface-2 border border-neon-cyan/10 rounded-xl px-4 h-11 text-sm font-bold outline-none focus:border-neon-cyan/30 placeholder:text-text-muted/30"
                            value={sch.lecturer}
                            onChange={(e) => updateScheduleField(index, { lecturer: e.target.value })}
                            placeholder="e.g. Dr. John"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                className={`btn h-16 w-full text-lg rounded-2xl font-black mt-4 transition-all duration-300 font-display
                  ${!form.name ? 'bg-surface-2 text-text-muted cursor-not-allowed border border-neon-cyan/5' : 'btn-primary hover:scale-[1.02] shadow-[0_0_30px_rgba(0,240,255,0.15)]'}`}
                onClick={handleSave}
                disabled={!form.name}
              >
                {editingId ? 'Confirm Update' : 'Accept Archives'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
