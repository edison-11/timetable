import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ical from 'ical-generator';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const safeFileName = (value) => String(value || 'Timetable').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_');

const formatTime = (value) => (value ? String(value).slice(0, 5) : '');

const formatTimeRange = (start, end) => {
  const formattedStart = formatTime(start);
  const formattedEnd = formatTime(end);
  return formattedStart || formattedEnd ? `${formattedStart} - ${formattedEnd}` : '-';
};

const isBreakEntry = (entry) => {
  return entry?.entry_type === 'break' || String(entry?.module_name || '').toLowerCase().includes('break');
};

const getBreakLabel = (entryOrLabel) => {
  const normalized = String(entryOrLabel?.module_name || entryOrLabel?.label || entryOrLabel || '').toLowerCase();
  if (normalized.includes('morning')) return 'MORNING BREAK';
  if (normalized.includes('lunch')) return 'LUNCH BREAK';
  if (normalized.includes('evening') || normalized.includes('afternoon')) return 'EVENING BREAK';
  return String(entryOrLabel?.module_name || entryOrLabel?.label || 'BREAK').toUpperCase();
};

const getRoom = (entry) => entry?.room || entry?.room_name || 'TBA';

const formatCell = (entry, separator = '\n') => {
  if (!entry) return '-';
  if (isBreakEntry(entry)) return getBreakLabel(entry);

  const details = [entry.module_name || 'Class'];
  const teacher = entry.teacher_name || (entry.entry_type === 'activity' ? 'Shared activity' : '');
  if (teacher) details.push(teacher);
  if (entry.entry_type !== 'activity') details.push(getRoom(entry));
  return details.join(separator);
};

const buildRowsFromEntries = (entries) => {
  const timeSlots = new Map();

  entries.forEach((entry) => {
    const start = formatTime(entry.start_time);
    const end = formatTime(entry.end_time);
    if (!start || !end) return;

    const key = `${isBreakEntry(entry) ? 'break' : 'period'}-${start}-${end}`;
    if (!timeSlots.has(key)) {
      timeSlots.set(key, {
        key,
        type: isBreakEntry(entry) ? 'break' : 'period',
        label: isBreakEntry(entry) ? getBreakLabel(entry) : '',
        start_time: start,
        end_time: end,
        entriesByDay: {}
      });
    }

    if (!isBreakEntry(entry)) {
      timeSlots.get(key).entriesByDay[entry.day_of_week] = entry;
    }
  });

  let period = 0;
  return Array.from(timeSlots.values())
    .sort((a, b) => {
      const timeDiff = a.start_time.localeCompare(b.start_time);
      if (timeDiff !== 0) return timeDiff;
      if (a.type === b.type) return 0;
      return a.type === 'break' ? -1 : 1;
    })
    .map((row) => {
      if (row.type === 'break') return row;
      period += 1;
      return { ...row, period };
    });
};

const getExportRows = (timetableData, options = {}) => {
  if (Array.isArray(options.rows)) return options.rows;
  return buildRowsFromEntries(Array.isArray(timetableData) ? timetableData : []);
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const cellHtml = (entry) => {
  return escapeHtml(formatCell(entry, '\n')).replace(/\n/g, '<br>');
};

const buildTimetableHtml = (rows, className) => {
  const compact = rows.length > 9;
  const fontSize = compact ? 9 : 11;
  const cellPadding = compact ? 4 : 7;
  const bodyRows = rows.map((row) => {
    if (row.type === 'break') {
      return `
        <tr class="break-row">
          <td>${escapeHtml(row.label || 'BREAK')}</td>
          <td>${escapeHtml(formatTimeRange(row.start_time, row.end_time))}</td>
          <td colspan="${DAYS.length}">${escapeHtml(row.label || 'BREAK')}</td>
        </tr>`;
    }

    return `
      <tr>
        <td>${escapeHtml(row.period || '')}</td>
        <td>${escapeHtml(formatTimeRange(row.start_time, row.end_time))}</td>
        ${DAYS.map((day) => `<td>${cellHtml(row.entriesByDay?.[day])}</td>`).join('')}
      </tr>`;
  }).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(className)} - Timetable</title>
  <style>
    html, body { margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #111827; }
    h1 { margin: 0 0 3px; font-size: ${compact ? 18 : 22}px; }
    .generated { margin: 0 0 ${compact ? 8 : 14}px; color: #4b5563; font-size: ${compact ? 10 : 12}px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th { background: #2563eb; color: #fff; font-weight: 700; text-align: center; }
    th, td { border: 1px solid #bfdbfe; padding: ${cellPadding}px; vertical-align: top; font-size: ${fontSize}px; line-height: 1.2; }
    td:first-child, td:nth-child(2) { text-align: center; white-space: nowrap; }
    .break-row td { background: #eff6ff; font-weight: 700; text-align: center; }
    tr { page-break-inside: avoid; }
    @page { size: landscape; margin: 8mm; }
  </style>
</head>
<body>
  <h1>${escapeHtml(className)} - Timetable</h1>
  <p class="generated">Generated on ${escapeHtml(new Date().toLocaleDateString())}</p>
  <table>
    <colgroup>
      <col style="width: 7%;">
      <col style="width: 12%;">
      ${DAYS.map(() => '<col style="width: 16.2%;">').join('')}
    </colgroup>
    <thead>
      <tr>
        <th>Period</th>
        <th>Time</th>
        ${DAYS.map((day) => `<th>${escapeHtml(day)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;
};

export const exportToPDF = (timetableData, className = 'Timetable', options = {}) => {
  const rows = getExportRows(timetableData, options);
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 7;
  const titleY = 13;
  const generatedY = 19;
  const startY = 24;
  const usableWidth = pageWidth - (margin * 2);
  const usableHeight = pageHeight - startY - margin;
  const estimatedRowHeight = usableHeight / Math.max(rows.length + 1, 1);
  const fontSize = clamp(estimatedRowHeight * 1.05, 5, 8);
  const cellPadding = clamp(estimatedRowHeight * 0.12, 0.6, 1.8);
  const periodWidth = 14;
  const timeWidth = 25;
  const dayWidth = (usableWidth - periodWidth - timeWidth) / DAYS.length;

  doc.setFontSize(rows.length > 9 ? 14 : 16);
  doc.text(`${className} - Timetable`, margin, titleY);

  doc.setFontSize(8);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, generatedY);

  const body = rows.map((row) => {
    if (row.type === 'break') {
      return [
        row.label || 'BREAK',
        formatTimeRange(row.start_time, row.end_time),
        row.label || 'BREAK',
        '',
        '',
        '',
        ''
      ];
    }

    return [
      row.period || '',
      formatTimeRange(row.start_time, row.end_time),
      ...DAYS.map((day) => formatCell(row.entriesByDay?.[day]))
    ];
  });

  autoTable(doc, {
    head: [['Period', 'Time', ...DAYS]],
    body,
    startY,
    margin: { top: margin, right: margin, bottom: margin, left: margin },
    theme: 'grid',
    tableWidth: usableWidth,
    pageBreak: 'avoid',
    rowPageBreak: 'avoid',
    styles: {
      fontSize,
      cellPadding,
      valign: 'middle',
      overflow: 'linebreak',
      lineColor: [219, 234, 254],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: periodWidth, halign: 'center' },
      1: { cellWidth: timeWidth, halign: 'center' },
      2: { cellWidth: dayWidth },
      3: { cellWidth: dayWidth },
      4: { cellWidth: dayWidth },
      5: { cellWidth: dayWidth },
      6: { cellWidth: dayWidth }
    },
    didParseCell: (data) => {
      const sourceRow = rows[data.row.index];
      if (data.section === 'body' && sourceRow?.type === 'break') {
        data.cell.styles.fillColor = [239, 246, 255];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.halign = data.column.index >= 2 ? 'center' : data.cell.styles.halign;
      }
    }
  });

  doc.save(`${safeFileName(className)}_timetable.pdf`);
};

export const exportToWord = (timetableData, className = 'Timetable', options = {}) => {
  const rows = getExportRows(timetableData, options);
  const html = buildTimetableHtml(rows, className);
  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.download = `${safeFileName(className)}_timetable.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

export const printTimetable = (timetableData, className = 'Timetable', options = {}) => {
  const rows = getExportRows(timetableData, options);
  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(buildTimetableHtml(rows, className));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

export const exportToICal = (timetableData, className = 'Timetable') => {
  const calendar = ical({ name: `${className} Timetable` });

  timetableData.forEach(entry => {
    if (!entry.start_time || !entry.end_time || !entry.day_of_week) return;

    const dayIndex = DAYS.indexOf(entry.day_of_week);
    if (dayIndex === -1) return;

    const today = new Date();
    const eventDate = new Date(today);
    eventDate.setDate(today.getDate() + ((dayIndex + 7 - today.getDay()) % 7));

    const [startHour, startMin] = entry.start_time.split(':').map(Number);
    const [endHour, endMin] = entry.end_time.split(':').map(Number);

    const startDate = new Date(eventDate);
    startDate.setHours(startHour, startMin, 0, 0);

    const endDate = new Date(eventDate);
    endDate.setHours(endHour, endMin, 0, 0);

    calendar.createEvent({
      start: startDate,
      end: endDate,
      summary: isBreakEntry(entry) ? getBreakLabel(entry) : entry.module_name || 'Class',
      description: isBreakEntry(entry)
        ? `${getBreakLabel(entry)}\nClass: ${entry.class_name || className}`
        : `Teacher: ${entry.teacher_name || 'TBA'}\nRoom: ${getRoom(entry)}\nClass: ${entry.class_name || className}`,
      location: isBreakEntry(entry) ? '' : getRoom(entry),
      repeating: {
        freq: 'WEEKLY'
      }
    });
  });

  calendar.download(`${safeFileName(className)}_timetable.ics`);
};
