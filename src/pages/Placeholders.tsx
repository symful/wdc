export function Dashboard() {
  return (
    <div className="flex-col gap-6">
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Dashboard Analitik</h1>
        <p className="text-muted">Ikhtisar produktivitas belajar dan jadwal Anda minggu ini.</p>
      </div>
      <div className="glass-panel" style={{ padding: '24px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-secondary">Fitur Dashboard akan segera hadir (Tugas, Heatmap, Session log)</p>
      </div>
    </div>
  );
}

export function Schedule() {
  return (
    <div className="flex-col gap-6">
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Pengelolaan Waktu</h1>
        <p className="text-muted">Jadwal kuliah, belajar, dan tugas dengan smart scheduling.</p>
      </div>
    </div>
  );
}

export function Tasks() {
  return (
    <div className="flex-col gap-6">
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Pencatatan Tugas</h1>
        <p className="text-muted">Kanban board dan daftar tugas prioritas.</p>
      </div>
    </div>
  );
}

export function Study() {
  return (
    <div className="flex-col gap-6">
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Aktivitas Belajar</h1>
        <p className="text-muted">Logging waktu belajar dan progress topik perkuliahan.</p>
      </div>
    </div>
  );
}
