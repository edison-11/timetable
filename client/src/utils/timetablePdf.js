const escapePdfText = (value) => String(value ?? '')
  .replace(/[^\x20-\x7E]/g, ' ')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')

const hexToRgb = (hex, fallback = [255, 255, 255]) => {
  const normalized = String(hex || '').replace('#', '').trim()
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return fallback
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16)
  ]
}

const colorCommand = (hex, mode = 'rg') => {
  const [r, g, b] = hexToRgb(hex)
  return `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} ${mode}`
}

const wrapText = (value, maxChars) => {
  const words = String(value ?? '').split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  })

  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

const createObject = (id, body) => `${id} 0 obj\n${body}\nendobj\n`

export const downloadTimetablePdf = ({
  title,
  subtitle = '',
  headers,
  rows,
  filename = 'timetable.pdf',
  fitToOnePage = false
}) => {
  const pageWidth = 842
  const pageHeight = 595
  const margin = 28
  const tableWidth = pageWidth - margin * 2
  const fixedColumnWidths = headers.length > 6 ? [52, 96] : [96]
  const fixedWidth = fixedColumnWidths.reduce((sum, width) => sum + width, 0)
  const flexibleWidth = (tableWidth - fixedWidth) / Math.max(headers.length - fixedColumnWidths.length, 1)
  const colWidths = headers.map((_, index) => fixedColumnWidths[index] || flexibleWidth)
  const titleHeight = subtitle ? 40 : 28
  const headerHeight = fitToOnePage ? 24 : 30
  const availableRowHeight = (pageHeight - margin * 2 - titleHeight - headerHeight) / Math.max(rows.length, 1)
  const rowHeight = fitToOnePage
    ? Math.max(24, Math.min(46, availableRowHeight))
    : 58
  const maxLinesPerCell = fitToOnePage ? Math.max(2, Math.floor((rowHeight - 8) / 8)) : 4
  const bodyFontSize = fitToOnePage ? 7 : 8
  const boldFontSize = fitToOnePage ? 7.5 : 9
  const lineGap = fitToOnePage ? 8 : 11
  const bottomLimit = margin
  const pages = []
  let y = pageHeight - margin
  let stream = ''

  const rect = (x, rectY, width, height, fill = '#ffffff', stroke = '#cbd5e1') => {
    stream += `${colorCommand(fill, 'rg')}\n${x.toFixed(2)} ${rectY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f\n`
    stream += `${colorCommand(stroke, 'RG')}\n${x.toFixed(2)} ${rectY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S\n`
  }

  const text = (value, x, textY, size = 9, color = '#111827') => {
    stream += `BT /F1 ${size} Tf ${colorCommand(color, 'rg')} ${x.toFixed(2)} ${textY.toFixed(2)} Td (${escapePdfText(value)}) Tj ET\n`
  }

  const finishPage = () => {
    pages.push(stream)
    stream = ''
  }

  const drawHeader = () => {
    text(title, margin, y, 18, '#0f172a')
    if (subtitle) {
      text(subtitle, margin, y - 18, 10, '#475569')
    }
    y -= titleHeight
    let x = margin
    headers.forEach((header, index) => {
      rect(x, y - headerHeight, colWidths[index], headerHeight, '#0f2f5f', '#0f2f5f')
      text(header, x + 6, y - (fitToOnePage ? 16 : 19), fitToOnePage ? 8 : 9, '#ffffff')
      x += colWidths[index]
    })
    y -= headerHeight
  }

  drawHeader()

  rows.forEach((row) => {
    if (!fitToOnePage && y - rowHeight < bottomLimit) {
      finishPage()
      y = pageHeight - margin
      drawHeader()
    }

    let x = margin
    row.cells.forEach((cell, index) => {
      const width = colWidths[index]
      const fill = cell.fill || (row.type === 'break' ? '#e8f7e9' : '#ffffff')
      rect(x, y - rowHeight, width, rowHeight, fill, '#cbd5e1')

      const maxChars = Math.max(Math.floor(width / 5.2), 8)
      const lines = wrapText(cell.text, maxChars).slice(0, maxLinesPerCell)
      lines.forEach((line, lineIndex) => {
        text(
          line,
          x + 5,
          y - 13 - lineIndex * lineGap,
          lineIndex === 0 && cell.bold ? boldFontSize : bodyFontSize,
          cell.color || '#111827'
        )
      })
      x += width
    })
    y -= rowHeight
  })

  finishPage()

  const objects = []
  const catalogId = 1
  const pagesId = 2
  const fontId = 3
  const pageIds = pages.map((_, index) => 4 + index * 2)
  const contentIds = pages.map((_, index) => 5 + index * 2)

  objects.push(createObject(catalogId, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`))
  objects.push(createObject(pagesId, `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`))
  objects.push(createObject(fontId, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'))

  pages.forEach((pageStream, index) => {
    objects.push(createObject(pageIds[index], `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`))
    objects.push(createObject(contentIds[index], `<< /Length ${pageStream.length} >>\nstream\n${pageStream}endstream`))
  })

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object) => {
    offsets.push(pdf.length)
    pdf += object
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
