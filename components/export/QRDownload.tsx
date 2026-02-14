'use client'

import { useCallback, useState } from 'react'
import { jsPDF } from 'jspdf'
import { Button } from '@/components/ui/button'
import { FileImage, FileText } from 'lucide-react'

/** Convert blob URL to data URL for use in PDF/download */
async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  const res = await fetch(blobUrl)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

export interface QRDownloadProps {
  /** URL of the QR image (data URL or blob URL from API) */
  qrDataUrl: string | null
  /** Filename base for downloads (e.g. "event-qr", "ticket-qr") */
  filenameBase?: string
  /** Optional title to show above QR in PDF */
  pdfTitle?: string
  /** Optional subtitle (e.g. event name) */
  pdfSubtitle?: string
  /** Optional class for container */
  className?: string
}

/**
 * Buttons to download QR as PNG or PDF.
 * Accepts data URL or blob URL (converted when needed).
 */
export function QRDownload({
  qrDataUrl,
  filenameBase = 'qr-code',
  pdfTitle = 'QR Code',
  pdfSubtitle,
  className = '',
}: QRDownloadProps) {
  const [loading, setLoading] = useState<'png' | 'pdf' | null>(null)

  const getDataUrl = useCallback(async (): Promise<string | null> => {
    if (!qrDataUrl) return null
    if (qrDataUrl.startsWith('data:')) return qrDataUrl
    if (qrDataUrl.startsWith('blob:')) return blobUrlToDataUrl(qrDataUrl)
    return null
  }, [qrDataUrl])

  const handleDownloadPng = useCallback(async () => {
    const dataUrl = await getDataUrl()
    if (!dataUrl) return
    setLoading('png')
    try {
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${filenameBase}.png`
      a.click()
    } finally {
      setLoading(null)
    }
  }, [getDataUrl, filenameBase])

  const handleDownloadPdf = useCallback(async () => {
    const dataUrl = await getDataUrl()
    if (!dataUrl) return
    setLoading('pdf')
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = 210
      const margin = 20
      let y = margin

      pdf.setFontSize(18)
      pdf.text(pdfTitle, margin, y)
      y += 10
      if (pdfSubtitle) {
        pdf.setFontSize(12)
        pdf.text(pdfSubtitle, margin, y)
        y += 8
      }
      y += 10

      const qrSize = 50
      const x = (pageW - qrSize) / 2
      pdf.addImage(dataUrl, 'PNG', x, y, qrSize, qrSize)
      pdf.save(`${filenameBase}.pdf`)
    } finally {
      setLoading(null)
    }
  }, [getDataUrl, filenameBase, pdfTitle, pdfSubtitle])

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownloadPng}
        disabled={!qrDataUrl}
        className="min-h-[44px] touch-manipulation"
        aria-label="Download QR as PNG image"
      >
        <FileImage className="w-4 h-4 mr-2" aria-hidden />
        {loading === 'png' ? '...' : 'Download PNG'}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownloadPdf}
        disabled={!qrDataUrl}
        className="min-h-[44px] touch-manipulation"
        aria-label="Download QR as PDF"
      >
        <FileText className="w-4 h-4 mr-2" aria-hidden />
        {loading === 'pdf' ? '...' : 'Download PDF'}
      </Button>
    </div>
  )
}
