'use client'

import { useCallback, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Button } from '@/components/ui/button'
import { FileText, Table } from 'lucide-react'

export interface ReportTable {
  title: string
  headers: string[]
  rows: (string | number)[][]
}

export interface ReportExportProps {
  /** Report title (e.g. "Admin Report", "DJ Report") */
  title: string
  /** Summary rows shown at top of report */
  summary: { label: string; value: string | number }[]
  /** Optional tables to include (each becomes a section in PDF / CSV) */
  tables?: ReportTable[]
  /** Optional class for container */
  className?: string
}

function escapeCsvCell(val: string | number): string {
  const s = String(val)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function ReportExport({
  title,
  summary,
  tables = [],
  className = '',
}: ReportExportProps) {
  const [loading, setLoading] = useState<'csv' | 'pdf' | null>(null)

  const generatedAt = new Date().toLocaleString()

  const handleExportCsv = useCallback(() => {
    setLoading('csv')
    try {
      const lines: string[] = [title, `Generated,${generatedAt}`, '']
      summary.forEach(({ label, value }) => {
        lines.push(`${escapeCsvCell(label)},${escapeCsvCell(value)}`)
      })
      lines.push('')
      tables.forEach((tab) => {
        lines.push(tab.title)
        lines.push(tab.headers.map(escapeCsvCell).join(','))
        tab.rows.forEach((row) => lines.push(row.map(escapeCsvCell).join(',')))
        lines.push('')
      })
      const csv = lines.join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `report-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    } finally {
      setLoading(null)
    }
  }, [title, generatedAt, summary, tables])

  const handleExportPdf = useCallback(() => {
    setLoading('pdf')
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const margin = 14
      let y = margin

      pdf.setFontSize(18)
      pdf.text(title, margin, y)
      y += 10
      pdf.setFontSize(10)
      pdf.text(`Generated: ${generatedAt}`, margin, y)
      y += 10

      pdf.setFontSize(12)
      pdf.text('Summary', margin, y)
      y += 6
      summary.forEach(({ label, value }) => {
        pdf.setFontSize(10)
        pdf.text(`${label}: ${value}`, margin, y)
        y += 6
      })
      y += 8

      tables.forEach((tab) => {
        if (y > 250) {
          pdf.addPage()
          y = margin
        }
        pdf.setFontSize(12)
        pdf.text(tab.title, margin, y)
        y += 6
        autoTable(pdf, {
          head: [tab.headers],
          body: tab.rows,
          startY: y,
          margin: { left: margin },
          theme: 'grid',
          headStyles: { fillColor: [124, 58, 237] },
          styles: { fontSize: 8 },
        })
        y = (pdf as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      })

      pdf.save(`report-${Date.now()}.pdf`)
    } finally {
      setLoading(null)
    }
  }, [title, generatedAt, summary, tables])

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExportCsv}
        className="min-h-[44px] touch-manipulation"
        aria-label="Download report as CSV"
      >
        <Table className="w-4 h-4 mr-2" aria-hidden />
        {loading === 'csv' ? '...' : 'Download CSV'}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExportPdf}
        className="min-h-[44px] touch-manipulation"
        aria-label="Download report as PDF"
      >
        <FileText className="w-4 h-4 mr-2" aria-hidden />
        {loading === 'pdf' ? '...' : 'Download PDF'}
      </Button>
    </div>
  )
}
