import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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

const getCustomContent = (options = {}) => String(options.customContent || options.custom_header_content || '').trim()

const getHeaderPosition = (options = {}) => {
  const position = String(options.headerPosition || options.header_position || 'left').toLowerCase()
  return ['left', 'center', 'right'].includes(position) ? position : 'left'
}

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

const logoDataUrlPromises = new Map()

const getLogoDataUrl = async (logoUrl = SCHOOL_LOGO_URL) => {
  const source = String(logoUrl || SCHOOL_LOGO_URL)
  if (!logoDataUrlPromises.has(source)) {
    logoDataUrlPromises.set(source, fetch(source)
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => (blob ? blobToDataUrl(blob) : ''))
      .catch(() => ''))
  }

  return logoDataUrlPromises.get(source)
}

const getImageFormat = (dataUrl = '') => {
  const match = String(dataUrl).match(/^data:image\/([a-zA-Z0-9+.-]+);/)
  const type = String(match?.[1] || 'png').toLowerCase()
  if (type.includes('jpeg') || type.includes('jpg')) return 'JPEG'
  if (type.includes('webp')) return 'WEBP'
  return 'PNG'
}

const buildFooterHtml = (options = {}) => {
  const preparedBy = getSignatureText(options.preparedBy, '________________')
  const approvedBy = getSignatureText(options.approvedBy, '________________')
  return `
    <tfoot class="signature-footer">
        <tr>
          <td colspan="3">
            <span class="signature-label">Prepared by</span>
            <span class="signature-name">${escapeHtml(preparedBy)}</span>
          </td>
          <td colspan="4">
            <span class="signature-label">Approved by</span>
            <span class="signature-name">${escapeHtml(approvedBy)}</span>
          </td>
        </tr>
    </tfoot>
  `
}

const buildHeaderHtml = async (className, options = {}) => {
  const logoDataUrl = await getLogoDataUrl(options.logoUrl)
  const preparedBy = getSignatureText(options.preparedBy, '________________')
  const approvedBy = getSignatureText(options.approvedBy, '________________')
  const meta = getExportMeta(options)
  const headerPosition = getHeaderPosition(options)
  const customContent = getCustomContent(options)

  return `
    <header class="export-header header-${headerPosition}">
      <div class="brand-block">
        <div class="brand-logo-wrap">
          ${logoDataUrl ? `<img class="brand-logo" src="${logoDataUrl}" width="36" height="36" style="width:36px;height:36px;max-width:36px;max-height:36px;object-fit:contain;" alt="School logo">` : ''}
        </div>
        <div class="brand-copy">
          <p class="brand-eyebrow">School Timetable</p>
          <h1>${escapeHtml(className)} - Timetable</h1>
          <p class="generated">Generated on ${escapeHtml(new Date().toLocaleDateString())}</p>
          ${customContent ? `<p class="custom-header-content">${escapeHtml(customContent).replace(/\n/g, '<br>')}</p>` : ''}
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
  const fontSize = compact ? 5.4 : 6.2
  const cellPadding = compact ? 1.2 : 1.8
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
    body { font-family: Arial, sans-serif; color: #111827; padding: 0; }
    .export-header { margin-bottom: 4px; padding-bottom: 3px; border-bottom: 1px solid #dbe3ef; page-break-after: avoid; break-after: avoid; }
    .export-header.header-left { text-align: left; }
    .export-header.header-center { text-align: center; }
    .export-header.header-right { text-align: right; }
    .brand-block { display: flex; align-items: center; gap: 8px; }
    .header-left .brand-block { justify-content: flex-start; }
    .header-center .brand-block { justify-content: center; }
    .header-right .brand-block { justify-content: flex-end; }
    .brand-logo-wrap { width: 36px !important; height: 36px !important; max-width: 36px !important; max-height: 36px !important; flex: 0 0 auto; display: flex; align-items: center; justify-content: center; border: 1px solid #dbe3ef; border-radius: 5px; background: #fff; overflow: hidden; }
    .brand-logo { display: block; width: 36px !important; height: 36px !important; max-width: 36px !important; max-height: 36px !important; object-fit: contain; }
    .brand-copy h1 { margin: 0 0 2px; font-size: ${compact ? 11 : 12}pt; line-height: 1.08; }
    .brand-eyebrow { margin: 0 0 2px; color: #2563eb; font-size: 5.5pt; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
    .generated { margin: 0; color: #4b5563; font-size: 5.6pt; }
    .custom-header-content { margin: 1px 0 0; color: #1f2937; font-size: 5.6pt; line-height: 1.15; white-space: pre-line; }
    .export-meta { display: flex; flex-wrap: wrap; gap: 2px 8px; margin-top: 2px; color: #1f2937; font-size: 5.6pt; font-weight: 700; }
    .header-left .export-meta { justify-content: flex-start; }
    .header-center .export-meta { justify-content: center; }
    .header-right .export-meta { justify-content: flex-end; }
    .export-meta span { display: inline-flex; align-items: center; gap: 0.35rem; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; page-break-inside: avoid; break-inside: avoid; mso-page-break-inside: avoid; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    th { background: #2563eb; color: #fff; font-weight: 700; text-align: center; }
    th, td { border: 1px solid #bfdbfe; padding: ${cellPadding}pt; vertical-align: top; font-size: ${fontSize}pt; line-height: 1; }
    td:first-child, td:nth-child(2) { text-align: center; white-space: nowrap; }
    .break-row td { background: #eff6ff; font-weight: 700; text-align: center; }
    .signature-footer td { padding: 3pt 8pt 0; border: 0; background: #ffffff; vertical-align: top; }
    .signature-label { display: block; margin-bottom: 2pt; color: #334155; font-size: 4.6pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
    .signature-name { display: block; padding-top: 1.5pt; border-top: 1px solid #94a3b8; color: #0f172a; font-size: 5pt; font-weight: 700; }
    @page { size: A4 landscape; margin: 3mm; mso-page-orientation: landscape; }
    @media print {
      html, body { width: 291mm; min-height: 204mm; }
      .brand-logo-wrap,
      .brand-logo { width: 12mm !important; height: 12mm !important; max-width: 12mm !important; max-height: 12mm !important; }
    }
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
    ${footerHtml}
  </table>
</body>
</html>`
}

const renderTimetablePdf = (doc, timetableData, className = 'Timetable', options = {}) => {
  const rows = getExportRows(timetableData, options)
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 4
  const customContent = getCustomContent(options)
  const topMargin = customContent ? 25 : 18
  const bottomMargin = 9
  const usableWidth = pageWidth - (margin * 2)
  const usableHeight = pageHeight - topMargin - bottomMargin
  const estimatedRowHeight = usableHeight / Math.max(rows.length + 1, 1)
  const fontSize = Math.min(Math.max(estimatedRowHeight * 0.46, 4.8), 7.2)
  const cellPadding = Math.min(Math.max(estimatedRowHeight * 0.07, 0.55), 1.15)
  const minCellHeight = Math.max(estimatedRowHeight * 0.86, 8)
  const periodWidth = 13
  const timeWidth = 23
  const dayWidth = (usableWidth - periodWidth - timeWidth) / DAYS.length

  const logoDataUrl = doc.logoDataUrl || ''
  const preparedBy = getSignatureText(options.preparedBy, '________________')
  const approvedBy = getSignatureText(options.approvedBy, '________________')
  const meta = getExportMeta(options)
  const headerPosition = getHeaderPosition(options)

  const drawHeader = () => {
    const title = `${className} - Timetable`
    const metaLine = meta.join('    ')
    const generatedLine = `Generated on ${new Date().toLocaleDateString()}`
    const customLines = customContent ? doc.splitTextToSize(customContent, 150).slice(0, 2) : []
    const logoSize = logoDataUrl ? 14 : 0
    const logoGap = logoDataUrl ? 3 : 0

    doc.setFontSize(12.5)
    doc.setFont(undefined, 'bold')
    const titleWidth = doc.getTextWidth(title)
    doc.setFontSize(6.6)
    doc.setFont(undefined, 'normal')
    const metaWidth = metaLine ? doc.getTextWidth(metaLine) : 0
    const generatedWidth = doc.getTextWidth(generatedLine)
    const customWidth = customLines.reduce((max, line) => Math.max(max, doc.getTextWidth(line)), 0)
    const textWidth = Math.max(titleWidth, metaWidth, generatedWidth, customWidth)
    const blockWidth = Math.min(logoSize + logoGap + textWidth, pageWidth - (margin * 2))
    const blockX = headerPosition === 'center'
      ? (pageWidth - blockWidth) / 2
      : headerPosition === 'right'
        ? pageWidth - margin - blockWidth
        : margin
    const logoX = blockX
    const textX = blockX + logoSize + logoGap

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, getImageFormat(logoDataUrl), logoX, 3, logoSize, logoSize)
    }
    doc.setFontSize(12.5)
    doc.setFont(undefined, 'bold')
    doc.text(title, textX, 8)
    doc.setFontSize(6.6)
    doc.setFont(undefined, 'normal')
    if (metaLine) doc.text(metaLine, textX, 13)
    doc.text(generatedLine, textX, 16)
    if (customLines.length) doc.text(customLines, textX, 19)
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
      valign: 'middle',
      overflow: 'ellipsize',
      lineColor: [219, 234, 254],
      lineWidth: 0.18,
      textColor: [55, 65, 81],
      minCellHeight,
      lineHeightFactor: 1.08
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: Math.min(fontSize + 0.2, 7.4),
      cellPadding: Math.max(cellPadding * 0.8, 0.7),
      minCellHeight: Math.max(minCellHeight * 0.72, 7)
    },
    columnStyles: {
      0: { cellWidth: periodWidth, halign: 'center', valign: 'middle' },
      1: { cellWidth: timeWidth, halign: 'center', valign: 'middle', fontSize: Math.min(fontSize, 6.6) },
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
  doc.logoDataUrl = await getLogoDataUrl(options.logoUrl)
  renderTimetablePdf(doc, timetableData, className, options)
  doc.save(`${safeFileName(className)}_timetable.pdf`)
}

export const exportMultipleTimetablesToPDF = async (groups, baseFileName = 'Timetable', optionsList = []) => {
  const doc = new jsPDF({ orientation: 'landscape' })
  const resolvedOptionsList = await Promise.all(groups.map(async (_group, index) => {
    const options = optionsList[index] || {}
    return {
      ...options,
      logoDataUrl: await getLogoDataUrl(options.logoUrl)
    }
  }))

  groups.forEach((group, index) => {
    if (index > 0) doc.addPage()
    const className = group.class_name || `Class ${group.class_id}`
    const options = resolvedOptionsList[index] || {}
    doc.logoDataUrl = options.logoDataUrl || ''
    renderTimetablePdf(doc, group.entries || group, className, options)
  })

  doc.save(`${safeFileName(baseFileName)}.pdf`)
}

// Load JSZip library dynamically for DOCX generation
const loadJSZip = async () => {
  if (window.JSZip) return window.JSZip
  const script = document.createElement('script')
  return new Promise((resolve, reject) => {
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
    script.onload = () => resolve(window.JSZip)
    script.onerror = () => reject(new Error('Failed to load JSZip library'))
    document.head.appendChild(script)
  })
}

const createDocxStructure = async (timetableData, className = 'Timetable', options = {}) => {
  const JSZip = await loadJSZip()
  const zip = new JSZip()
  const rows = getExportRows(timetableData, options)
  const logoDataUrl = await getLogoDataUrl(options.logoUrl)
  
  // Get logo image data
  let logoImageData = null
  let logoImageType = 'png'
  if (logoDataUrl) {
    try {
      const response = await fetch(logoDataUrl)
      const blob = await response.blob()
      logoImageData = await blobToBase64(blob)
      logoImageType = getImageFormat(logoDataUrl).toLowerCase()
    } catch (error) {
      console.warn('Failed to load logo for DOCX', error)
    }
  }

  const docTitle = `${className} - Timetable`
  const preparedBy = getSignatureText(options.preparedBy, '________________')
  const approvedBy = getSignatureText(options.approvedBy, '________________')
  const meta = getExportMeta(options)
  const generatedDate = new Date().toLocaleDateString()
  const headerPosition = getHeaderPosition(options)
  const customContent = getCustomContent(options)

  // Create [Content_Types].xml
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${logoImageData ? `<Default Extension="${logoImageType}" ContentType="image/${logoImageType}"/>` : ''}
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

  // Create _rels/.rels
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  // Create word/_rels/document.xml.rels
  let docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
  let imageRelId = 1
  if (logoImageData) {
    docRels += `\n  <Relationship Id="rId${imageRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.${logoImageType}"/>`
    imageRelId++
  }
  docRels += `\n</Relationships>`

  // Build table rows XML
  const tableRowsXml = rows.map((row, rowIndex) => {
    if (row.type === 'break') {
      return `
        <w:tr>
          <w:trPr><w:trHeight w:val="400" w:type="atLeast"/></w:trPr>
          <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="2563EB"/></w:rPr><w:t>${escapeHtml(row.label || 'BREAK')}</w:t></w:r></w:p></w:tc>
          <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>${escapeHtml(formatTimeRange(row.start_time, row.end_time))}</w:t></w:r></w:p></w:tc>
          ${DAYS.map(() => `<w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${escapeHtml(row.label || 'BREAK')}</w:t></w:r></w:p></w:tc>`).join('')}
        </w:tr>`
    }

    return `
        <w:tr>
          <w:trPr><w:trHeight w:val="400" w:type="atLeast"/></w:trPr>
          <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>${escapeHtml(row.period || '')}</w:t></w:r></w:p></w:tc>
          <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>${escapeHtml(formatTimeRange(row.start_time, row.end_time))}</w:t></w:r></w:p></w:tc>
          ${DAYS.map((day) => `<w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>${cellHtml(row.entriesByDay?.[day])}</w:t></w:r></w:p></w:tc>`).join('')}
        </w:tr>`
  }).join('')

  // Create document.xml
  const headerParagraphProps = `<w:pPr><w:jc w:val="${headerPosition}"/></w:pPr>`
  const logoXml = logoImageData ? `
      <w:p>${headerParagraphProps}<w:r><w:drawing><wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0" relativeHeight="251658240" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="margin"><wp:align>${headerPosition}</wp:align></wp:positionH><wp:positionV relativeFrom="paragraph"><wp:posOffset>0</wp:posOffset></wp:positionV><wp:extent cx="914400" cy="914400"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="1" name="Logo 1"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="logo.${logoImageType}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="914400" cy="914400"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p>
      <w:p>${headerParagraphProps}<w:r><w:rPr><w:sz w:val="32"/><w:b/></w:rPr><w:t>${escapeHtml(docTitle)}</w:t></w:r></w:p>
      <w:p>${headerParagraphProps}<w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>Generated on ${generatedDate}</w:t></w:r></w:p>
      ${customContent ? `<w:p>${headerParagraphProps}<w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeHtml(customContent)}</w:t></w:r></w:p>` : ''}
      ${meta.length ? meta.map(m => `<w:p>${headerParagraphProps}<w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeHtml(m)}</w:t></w:r></w:p>`).join('') : ''}` : `<w:p>${headerParagraphProps}<w:r><w:rPr><w:sz w:val="32"/><w:b/></w:rPr><w:t>${escapeHtml(docTitle)}</w:t></w:r></w:p><w:p>${headerParagraphProps}<w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>Generated on ${generatedDate}</w:t></w:r></w:p>${customContent ? `<w:p>${headerParagraphProps}<w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeHtml(customContent)}</w:t></w:r></w:p>` : ''}`

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>
    ${logoXml}
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9000" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="12" w:space="0" w:color="4B69FF"/>
          <w:left w:val="single" w:sz="12" w:space="0" w:color="4B69FF"/>
          <w:bottom w:val="single" w:sz="12" w:space="0" w:color="4B69FF"/>
          <w:right w:val="single" w:sz="12" w:space="0" w:color="4B69FF"/>
          <w:insideH w:val="single" w:sz="12" w:space="0" w:color="BFDBFE"/>
          <w:insideV w:val="single" w:sz="12" w:space="0" w:color="BFDBFE"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:trPr><w:trHeight w:val="400" w:type="atLeast"/></w:trPr>
        <w:tc><w:tcPr><w:shd w:fill="2563EB"/><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Slot</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:shd w:fill="2563EB"/><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Time</w:t></w:r></w:p></w:tc>
        ${DAYS.map((day) => `<w:tc><w:tcPr><w:shd w:fill="2563EB"/><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>${escapeHtml(day)}</w:t></w:r></w:p></w:tc>`).join('')}
      </w:tr>
      ${tableRowsXml}
    </w:tbl>
    <w:p><w:pPr><w:spacing w:before="400"/></w:pPr></w:p>
    <w:tbl>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr>
          <w:p><w:r><w:rPr><w:b/><w:sz w:val="18"/></w:rPr><w:t>Prepared by</w:t></w:r></w:p>
          <w:p><w:pPr><w:spacing w:before="200"/></w:pPr><w:r><w:t>${escapeHtml(preparedBy)}</w:t></w:r></w:p>
        </w:tc>
        <w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr>
          <w:p><w:r><w:rPr><w:b/><w:sz w:val="18"/></w:rPr><w:t>Approved by</w:t></w:r></w:p>
          <w:p><w:pPr><w:spacing w:before="200"/></w:pPr><w:r><w:t>${escapeHtml(approvedBy)}</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>`

  // Add files to ZIP
  zip.file('[Content_Types].xml', contentTypes)
  zip.folder('_rels').file('.rels', rels)
  zip.folder('word').file('document.xml', document)
  zip.folder('word/_rels').file('document.xml.rels', docRels)

  // Add logo image if present
  if (logoImageData) {
    const imageBuffer = base64ToArrayBuffer(logoImageData.split(',')[1])
    zip.folder('word/media').file(`logo.${logoImageType}`, imageBuffer, { binary: true })
  }

  return zip
}

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(reader.error || new Error('Failed to convert blob'))
  reader.readAsDataURL(blob)
})

const base64ToArrayBuffer = (base64) => {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

export const exportToWord = async (timetableData, className = 'Timetable', options = {}) => {
  try {
    const zip = await createDocxStructure(timetableData, className, options)
    const blob = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')

    link.href = URL.createObjectURL(blob)
    link.download = `${safeFileName(className)}_timetable.docx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  } catch (error) {
    console.error('Error generating DOCX:', error)
    throw new Error('Failed to generate Word document. Please try again.')
  }
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

