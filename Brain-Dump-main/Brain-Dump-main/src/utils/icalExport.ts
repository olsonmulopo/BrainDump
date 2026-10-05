/**
 * iCalendar (.ics) generator and downloader.
 * Allows exporting workspace calendar events and task deadlines to Google Calendar, Apple Calendar, and Outlook.
 */

export interface IcalExportEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  endTime?: string;
  category?: string;
  notes?: string;
  boardTitle?: string;
}

export function exportToIcs(events: IcalExportEvent[], calendarTitle = 'Brain Dump Calendar'): void {
  const pad = (n: number) => String(n).padStart(2, '0');

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Brain Dump Visual Workspace//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarTitle.replace(/[\\;,]/g, ' ')}`,
    'X-WR-TIMEZONE:UTC',
  ];

  events.forEach((ev) => {
    const parts = ev.date.split('-');
    if (parts.length !== 3) return;
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];

    const uid = `${ev.id.replace(/[^a-zA-Z0-9_-]/g, '')}@braindump.local`;
    const summary = ev.title.replace(/[\\;\n\r]/g, ' ').trim();
    const descParts: string[] = [];
    if (ev.category) descParts.push(`Category: ${ev.category}`);
    if (ev.boardTitle) descParts.push(`Board: ${ev.boardTitle}`);
    if (ev.notes) descParts.push(`Notes: ${ev.notes.replace(/[\\;\n\r]/g, ' ')}`);
    const description = descParts.join(' | ');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${y}${m}${d}T000000Z`);

    if (ev.time) {
      const timeParts = ev.time.split(':');
      const th = pad(parseInt(timeParts[0] || '0', 10));
      const tm = pad(parseInt(timeParts[1] || '0', 10));

      lines.push(`DTSTART:${y}${m}${d}T${th}${tm}00`);

      if (ev.endTime) {
        const endParts = ev.endTime.split(':');
        const eh = pad(parseInt(endParts[0] || '0', 10));
        const em = pad(parseInt(endParts[1] || '0', 10));
        lines.push(`DTEND:${y}${m}${d}T${eh}${em}00`);
      } else {
        // Default 1 hour
        const eh = pad((parseInt(timeParts[0] || '0', 10) + 1) % 24);
        lines.push(`DTEND:${y}${m}${d}T${eh}${tm}00`);
      }
    } else {
      // All-day event
      lines.push(`DTSTART;VALUE=DATE:${y}${m}${d}`);
      // End day in iCal all-day is exclusive
      const nextDay = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10) + 1);
      const ny = nextDay.getFullYear();
      const nm = pad(nextDay.getMonth() + 1);
      const nd = pad(nextDay.getDate());
      lines.push(`DTEND;VALUE=DATE:${ny}${nm}${nd}`);
    }

    lines.push(`SUMMARY:${summary}`);
    if (description) {
      lines.push(`DESCRIPTION:${description}`);
    }
    if (ev.category) {
      lines.push(`CATEGORIES:${ev.category.toUpperCase()}`);
    }
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  const icsContent = lines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${calendarTitle.toLowerCase().replace(/\s+/g, '-')}-${yymmddToday()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function yymmddToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
