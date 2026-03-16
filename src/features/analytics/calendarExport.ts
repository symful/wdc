import type { AcademicCourse } from '../../store/useAcademicStore';
import type { Task } from '../../store/useTaskStore';

function formatICSDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function escapeICS(text: string): string {
  return text.replace(/[,;\\]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
}

export function generateICS(courses: AcademicCourse[], tasks: Task[]): void {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ontime!//StudiKu//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:ontime! Study Schedule',
  ];

  // Add course schedules as recurring events
  courses.forEach((course) => {
    course.schedules.forEach((sch) => {
      // Create event for the next occurrence of this day
      const now = new Date();
      const currentDay = (now.getDay() + 6) % 7; // Mon=0
      let daysUntil = sch.day - currentDay;
      if (daysUntil < 0) daysUntil += 7;

      const eventDate = new Date(now);
      eventDate.setDate(eventDate.getDate() + daysUntil);

      const [startH, startM] = sch.startTime.split(':').map(Number);
      const [endH, endM] = sch.endTime.split(':').map(Number);

      const startDate = new Date(eventDate);
      startDate.setHours(startH, startM, 0, 0);

      const endDate = new Date(eventDate);
      endDate.setHours(endH, endM, 0, 0);

      const icsDay = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'][sch.day];

      lines.push(
        'BEGIN:VEVENT',
        `UID:course-${course.id}-${sch.day}@ontime`,
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${icsDay};COUNT=16`,
        `SUMMARY:${escapeICS(course.name)}`,
        `DESCRIPTION:${escapeICS(`${course.code} — ${sch.room || 'TBA'} — ${sch.lecturer || 'N/A'}`)}`,
        `LOCATION:${escapeICS(sch.room || '')}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeICS(course.name)} dimulai dalam 15 menit`,
        'END:VALARM',
        'END:VEVENT'
      );
    });
  });

  // Add tasks as single events (deadline day, all-day or timed)
  tasks.forEach((task) => {
    if (task.status === 'done') return;

    const deadline = new Date(task.deadline);
    const dayBefore = new Date(deadline);
    dayBefore.setDate(dayBefore.getDate() - 1);

    lines.push(
      'BEGIN:VEVENT',
      `UID:task-${task.id}@ontime`,
      `DTSTART:${formatICSDate(deadline)}`,
      `DTEND:${formatICSDate(new Date(deadline.getTime() + 3600000))}`,
      `SUMMARY:[TASK] ${escapeICS(task.title)}`,
      `DESCRIPTION:${escapeICS(`Priority: ${task.priority} | Type: ${task.type} | Weight: ${task.weight}%`)}`,
      'STATUS:TENTATIVE',
      'BEGIN:VALARM',
      'TRIGGER:-PT60M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Deadline task: ${escapeICS(task.title)}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ontime_schedule_${new Date().toISOString().split('T')[0]}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
