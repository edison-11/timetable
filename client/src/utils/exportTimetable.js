import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ical from 'ical-generator'
import { FIXED_DAYS, buildFixedTimetableRows, isBreakEntry } from './fixedTimetableStructure'

const DAYS = FIXED_DAYS
const SCHOOL_LOGO_URL = `${import.meta.env.BASE_URL}timetable-logo.png`

const safeFileName = (value) => String(value || 'Timetable').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_')

const formatTime = (value) => (value ? String(value).slice(0, 5) : '')

const formatTimeRange = (start, end) => {
  const formattedStart = formatTime(start)
  const formattedEnd = formatTime(end)
  return formattedStart || formattedEnd ? `${formattedStart} - ${formattedEnd}` : '-'
}

const getBreakLabel = (entryOrLabel) => {
  const normalized = String(entryOrLabel?.module_name || entryOrLabel?.label || entryOrLabel || '').toLowerCase()
  if (normalized.includes('morning')) return 'MORNING BREAK'
  if (normalized.includes('lunch')) return 'LUNCH BREAK'
  if (normalized.includes('evening') || normalized.includes('afternoon')) return 'EVENING BREAK'
  return String(entryOrLabel?.module_name || entryOrLabel?.label || 'BREAK').toUpperCase()
}

const getRoom = (entry) => entry?.room || entry?.room_name || 'TBA'

const formatCell = (entry, separator = '\n') => {
  if (!entry) return '-'
  if (isBreakEntry(entry)) return getBreakLabel(entry)

  const details = [entry.module_name || 'Class']
  const teacher = entry.teacher_name || (entry.entry_type === 'activity' ? 'Shared activity' : '')
  if (teacher) details.push(teacher)
  if (entry.entry_type !== 'activity') details.push(getRoom(entry))
  return details.join(separator)
}

const buildRowsFromEntries = (entries) => {
  return buildFixedTimetableRows(entries, DAYS)
}

const getExportRows = (timetableData, options = {}) => {
  if (Array.isArray(options.rows)) return options.rows
  return buildRowsFromEntries(Array.isArray(timetableData) ? timetableData : [])
}

const getExportMeta = (options = {}) => {
  const meta = []
  if (options.level) meta.push(`Level: ${options.level}`)
  if (options.roomName) meta.push(`Room: ${options.roomName}`)
  return meta
}

const getSignatureText = (value, fallback) => String(value || fallback || '').trim() || fallback || '________________'

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#039;")

const cellHtml = (entry) => {
  return escapeHtml(formatCell(entry, '\n')).replace(/\n/g, '<br>')
}

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(reader.error || new Error('Unable to read logo asset'))
  reader.readAsDataURL(blob)
})

let logoDataUrlPromise = null

const getLogoDataUrl = async () => {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = fetch(SCHOOL_LOGO_URL)
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => (blob ? blobToDataUrl(blob) : ''))
      .catch(() => '')
  }

  return logoDataUrlPromise
}

const buildFooterHtml = (options = {}) => {
  const preparedBy = getSignatureText(options.preparedBy, '________________')
  const approvedBy = getSignatureText(options.approvedBy, '________________')
  return `
    <footer class="export-footer">
      <div class="footer-note">Prepared and approved for official timetable distribution.</div>
      <div class="signature-grid">
        <div class="signature-box">
          <span class="signature-label">Prepared by</span>
          <span class="signature-name">${escapeHtml(preparedBy)}</span>
        </div>
        <div class="signature-box">
          <span class="signature-label">Approved by</span>
          <span class="signature-name">${escapeHtml(approvedBy)}</span>
        </div>
      </div>
    </footer>
  `
}

const buildHeaderHtml = async (className, options = {}) => {
  const logoDataUrl = await getLogoDataUrl()
  const preparedBy = getSignatureText(options.preparedBy, '________________')
  const approvedBy = getSignatureText(options.approvedBy, '________________')
  const meta = getExportMeta(options)

  return `
    <header class="export-header">
      <div class="brand-block">
        <div class="brand-logo-wrap">
          ${logoDataUrl ? `<img class="brand-logo" src="${logoDataUrl}" alt="School logo">` : ''}
        </div>
        <div class="brand-copy">
          <p class="brand-eyebrow">School Timetable</p>
          <h1>${escapeHtml(className)} - Timetable</h1>
          <p class="generated">Generated on ${escapeHtml(new Date().toLocaleDateString())}</p>
        </div>
      </div>
      <div class="export-meta">
        ${meta.length ? meta.map((item) => `<span>${escapeHtml(item)}</span>`).join('') : '<span>Official timetable export</span>'}
        <span>Prepared by: ${escapeHtml(preparedBy)}</span>
        <span>Approved by: ${escapeHtml(approvedBy)}</span>
      </div>
    </header>
  `
}

const buildTimetableHtml = async (rows, className, options = {}) => {
  const compact = rows.length > 9
  const fontSize = compact ? 7.5 : 8.5
  const cellPadding = compact ? 2.5 : 3.5
  const headerHtml = await buildHeaderHtml(className, options)
  const footerHtml = buildFooterHtml(options)

  const bodyRows = rows.map((row) => {
    if (row.type === 'break') {
      return `
        <tr class="break-row">
          <td>${escapeHtml(row.label || 'BREAK')}</td>
          <td>${escapeHtml(formatTimeRange(row.start_time, row.end_time))}</td>
          <td colspan="${DAYS.length}">${escapeHtml(row.label || 'BREAK')}</td>
        </tr>`
    }

    return `
      <tr>
        <td>${escapeHtml(row.period || '')}</td>
        <td>${escapeHtml(formatTimeRange(row.start_time, row.end_time))}</td>
        ${DAYS.map((day) => `<td>${cellHtml(row.entriesByDay?.[day])}</td>`).join('')}
      </tr>`
  }).join('')

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(className)} - Timetable</title>
  <style>
    html, body { margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #111827; padding: 8px 10px 10px; }
    .export-header { margin-bottom: 6px; padding-bottom: 5px; border-bottom: 1px solid #dbe3ef; }
    .brand-block { display: flex; align-items: center; gap: 8px; }
    .brand-logo-wrap { width: 42px; height: 42px; flex: 0 0 auto; display: flex; align-items: center; justify-content: center; border: 1px solid #dbe3ef; border-radius: 8px; background: #fff; overflow: hidden; }
    .brand-logo { width: 100%; height: 100%; object-fit: contain; }
    .brand-copy h1 { margin: 0 0 2px; font-size: ${compact ? 13 : 15}px; line-height: 1.1; }
    .brand-eyebrow { margin: 0 0 2px; color: #2563eb; font-size: 7px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
    .generated { margin: 0; color: #4b5563; font-size: ${compact ? 7 : 8}px; }
    .export-meta { display: flex; flex-wrap: wrap; gap: 4px 10px; margin-top: 4px; color: #1f2937; font-size: ${compact ? 7 : 8}px; font-weight: 700; }
    .export-meta span { display: inline-flex; align-items: center; gap: 0.35rem; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th { background: #2563eb; color: #fff; font-weight: 700; text-align: center; }
    th, td { border: 1px solid #bfdbfe; padding: ${cellPadding}px; vertical-align: top; font-size: ${fontSize}px; line-height: 1.08; }
    td:first-child, td:nth-child(2) { text-align: center; white-space: nowrap; }
    .break-row td { background: #eff6ff; font-weight: 700; text-align: center; }
    .export-footer { margin-top: 6px; padding-top: 5px; border-top: 1px solid #dbe3ef; }
    .footer-note { margin: 0 0 4px; color: #475569; font-size: 7px; font-weight: 700; }
    .signature-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .signature-box { min-height: 26px; padding-top: 2px; }
    .signature-label { display: block; margin-bottom: 4px; color: #334155; font-size: 7px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
    .signature-name { display: block; padding-top: 3px; border-top: 1px solid #94a3b8; color: #0f172a; font-size: 7px; font-weight: 700; }
    @page { size: A4 landscape; margin: 4mm; }
  </style>
</head>
<body>
  ${headerHtml}
  <table>
    <colgroup>
      <col style="width: 7%;">
      <col style="width: 12%;">
      ${DAYS.map(() => '<col style="width: 16.2%;">').join('')}
    </colgroup>
    <thead>
      <tr>
        <th>Slot</th>
        <th>Time</th>
        ${DAYS.map((day) => `<th>${escapeHtml(day)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
  ${footerHtml}
</body>
</html>`
}

const renderTimetablePdf = (doc, timetableData, className = 'Timetable', options = {}) => {
  const rows = getExportRows(timetableData, options)
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 5
  const topMargin = 22
  const bottomMargin = 13
  const usableWidth = pageWidth - (margin * 2)
  const usableHeight = pageHeight - topMargin - bottomMargin
  const estimatedRowHeight = usableHeight / Math.max(rows.length + 1, 1)
  const fontSize = Math.min(Math.max(estimatedRowHeight * 0.42, 4.6), 6.1)
  const cellPadding = Math.min(Math.max(estimatedRowHeight * 0.05, 0.35), 0.9)
  const periodWidth = 11
  const timeWidth = 21
  const dayWidth = (usableWidth - periodWidth - timeWidth) / DAYS.length

  const logoDataUrl = doc.logoDataUrl || ''
  const preparedBy = getSignatureText(options.preparedBy, '________________')
  const approvedBy = getSignatureText(options.approvedBy, '________________')
  const meta = getExportMeta(options)

  const drawHeader = () => {
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', margin, 5, 12, 12)
    }
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text(`${className} - Timetable`, logoDataUrl ? margin + 15 : margin, 10)
    doc.setFontSize(6)
    doc.setFont(undefined, 'normal')
    if (meta.length) doc.text(meta.join('    '), logoDataUrl ? margin + 15 : margin, 15)
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, logoDataUrl ? margin + 15 : margin, 18)
  }

  const drawFooter = () => {
    const boxWidth = 86
    const boxY = pageHeight - 7
    const leftX = margin
    const rightX = pageWidth - margin - boxWidth

    doc.setDrawColor(148, 163, 184)
    doc.setFontSize(5.8)
    doc.setFont(undefined, 'bold')
    doc.text('Prepared by', leftX, boxY - 5)
    doc.line(leftX, boxY - 2, leftX + boxWidth, boxY - 2)
    doc.text(preparedBy, leftX, boxY)
    doc.text('Approved by', rightX, boxY - 5)
    doc.line(rightX, boxY - 2, rightX + boxWidth, boxY - 2)
    doc.text(approvedBy, rightX, boxY)
  }

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
      ]
    }

    return [
      row.period || '',
      formatTimeRange(row.start_time, row.end_time),
      ...DAYS.map((day) => formatCell(row.entriesByDay?.[day]))
    ]
  })

  autoTable(doc, {
    head: [['Period', 'Time', ...DAYS]],
    body,
    startY: topMargin,
    margin: { top: topMargin, right: margin, bottom: bottomMargin, left: margin },
    theme: 'grid',
    tableWidth: usableWidth,
    pageBreak: 'avoid',
    rowPageBreak: 'avoid',
    showHead: 'firstPage',
    styles: {
      fontSize,
      cellPadding,
      valign: 'top',
      overflow: 'ellipsize',
      lineColor: [219, 234, 254],
      lineWidth: 0.18,
      textColor: [55, 65, 81],
      minCellHeight: 4
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 5.8,
      cellPadding: 0.8
    },
    columnStyles: {
      0: { cellWidth: periodWidth, halign: 'center', valign: 'middle' },
      1: { cellWidth: timeWidth, halign: 'center', valign: 'middle', fontSize: 5.4 },
      2: { cellWidth: dayWidth },
      3: { cellWidth: dayWidth },
      4: { cellWidth: dayWidth },
      5: { cellWidth: dayWidth },
      6: { cellWidth: dayWidth }
    },
    didDrawPage: () => {
      drawHeader()
      drawFooter()
    },
    didParseCell: (data) => {
      const sourceRow = rows[data.row.index]
      if (data.section === 'body' && sourceRow?.type === 'break') {
        data.cell.styles.fillColor = [239, 246, 255]
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.halign = data.column.index >= 2 ? 'center' : data.cell.styles.halign
        data.cell.styles.valign = 'middle'
      }
    }
  })
}

export const exportToPDF = async (timetableData, className = 'Timetable', options = {}) => {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.logoDataUrl = await getLogoDataUrl()
  renderTimetablePdf(doc, timetableData, className, options)
  doc.save(`${safeFileName(className)}_timetable.pdf`)
}

export const exportMultipleTimetablesToPDF = async (groups, baseFileName = 'Timetable', optionsList = []) => {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.logoDataUrl = await getLogoDataUrl()

  groups.forEach((group, index) => {
    if (index > 0) doc.addPage()
    const className = group.class_name || `Class ${group.class_id}`
    renderTimetablePdf(doc, group.entries || group, className, optionsList[index] || {})
  })

  doc.save(`${safeFileName(baseFileName)}.pdf`)
}

export const exportToWord = async (timetableData, className = 'Timetable', options = {}) => {
  const rows = getExportRows(timetableData, options)
  const html = await buildTimetableHtml(rows, className, options)
  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
  const link = document.createElement('a')

  link.href = URL.createObjectURL(blob)
  link.download = `${safeFileName(className)}_timetable.doc`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

export const printTimetable = async (timetableData, className = 'Timetable', options = {}) => {
  const rows = getExportRows(timetableData, options)
  const printWindow = window.open('', '_blank', 'width=1200,height=800')
  if (!printWindow) return

  printWindow.document.open()
  printWindow.document.write(await buildTimetableHtml(rows, className, options))
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

export const exportToICal = (timetableData, className = 'Timetable') => {
  const calendar = ical({ name: `${className} Timetable` })

  timetableData.forEach((entry) => {
    if (!entry.start_time || !entry.end_time || !entry.day_of_week) return

    const dayIndex = DAYS.indexOf(entry.day_of_week)
    if (dayIndex === -1) return

    const today = new Date()
    const eventDate = new Date(today)
    eventDate.setDate(today.getDate() + ((dayIndex + 7 - today.getDay()) % 7))

    const [startHour, startMin] = entry.start_time.split(':').map(Number)
    const [endHour, endMin] = entry.end_time.split(':').map(Number)

    const startDate = new Date(eventDate)
    startDate.setHours(startHour, startMin, 0, 0)

    const endDate = new Date(eventDate)
    endDate.setHours(endHour, endMin, 0, 0)

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
    })
  })

  calendar.download(`${safeFileName(className)}_timetable.ics`)
}
