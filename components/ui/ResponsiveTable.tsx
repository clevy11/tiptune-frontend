'use client'

import { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  /** Optional: for mobile card label (e.g. "Event" instead of "Name") */
  cardLabel?: string
}

export interface ResponsiveTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string | number
  /** Optional table caption for accessibility */
  caption?: string
  /** Optional class for container */
  className?: string
  /** Optional class for desktop table */
  tableClassName?: string
  /** Optional class for mobile cards */
  cardClassName?: string
}

/**
 * Renders a table on desktop and stacked cards on mobile (breakpoint md).
 * Mobile-first: cards by default, table from md up.
 */
export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  caption,
  className = '',
  tableClassName = '',
  cardClassName = '',
}: ResponsiveTableProps<T>) {
  if (!data.length) {
    return (
      <div className={`text-center py-8 text-gray-400 ${className}`}>
        No data to display
      </div>
    )
  }

  return (
    <div className={className}>
      {caption && (
        <caption className="sr-only">{caption}</caption>
      )}
      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className={`w-full border-collapse ${tableClassName}`}>
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="text-left py-3 px-4 text-sm font-medium text-gray-400"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-4 text-sm text-gray-200">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            className={`rounded-lg border border-white/10 bg-white/5 p-4 space-y-2 ${cardClassName}`}
          >
            {columns.map((col) => (
              <div key={col.key} className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-500 font-medium">
                  {col.cardLabel ?? col.header}
                </span>
                <span className="text-sm text-gray-200">
                  {col.render(row)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
