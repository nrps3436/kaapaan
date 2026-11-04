interface Column {
  key: string
  label: string
  type?: 'text' | 'number' | 'date' | 'status'
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  onSort?: (key: string) => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
}

export default function DataTable({ columns, data, onSort, sortKey, sortDirection }: DataTableProps) {
  const getCellClass = (type?: string, align?: string) => {
    const baseClass = 'px-4 py-3 text-sm'
    const typeClass = type === 'number' ? 'font-mono' : ''
    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
    return `${baseClass} ${typeClass} ${alignClass}`
  }

  const getStatusColor = (value: string) => {
    const lower = value?.toLowerCase() || ''
    if (lower.includes('safe') || lower.includes('active')) return 'text-green-600 bg-green-50'
    if (lower.includes('warning') || lower.includes('moderate')) return 'text-yellow-600 bg-yellow-50'
    if (lower.includes('critical') || lower.includes('high')) return 'text-orange-600 bg-orange-50'
    if (lower.includes('danger') || lower.includes('sos')) return 'text-red-600 bg-red-50'
    return 'text-gray-600 bg-gray-50'
  }

  const renderCell = (row: any, col: Column) => {
    const value = row[col.key]
    
    if (col.type === 'status') {
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(value)}`}>
          {value}
        </span>
      )
    }
    
    if (col.type === 'number') {
      return <span className="tabular-nums">{typeof value === 'number' ? value.toFixed(2) : value}</span>
    }
    
    if (col.type === 'date' && value) {
      return new Date(value).toLocaleString()
    }
    
    return value
  }

  return (
    <div className="dataframe-container">
      <div className="dataframe-wrapper">
        <table className="dataframe-table">
          <thead className="dataframe-header">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${getCellClass(col.type, col.align)} ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="text-gray-400 text-xs">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? '▲' : '▼'
                        ) : (
                          '⇅'
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="dataframe-body">
            {data.map((row, idx) => (
              <tr key={idx} className="dataframe-row">
                {columns.map((col) => (
                  <td key={col.key} className={getCellClass(col.type, col.align)}>
                    {renderCell(row, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
