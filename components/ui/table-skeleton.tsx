import { TableBody, TableCell, TableRow } from '@/components/ui/table'

interface TableSkeletonProps {
  columns: number
  rows?: number
}

const WIDTHS = ['55%', '75%', '60%', '80%', '45%', '65%', '50%', '70%']

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="pointer-events-none">
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <div
                className="h-3.5 rounded-md"
                style={{
                  background: 'var(--field-raised)',
                  width: j === columns - 1 ? '64px' : WIDTHS[(i * columns + j) % WIDTHS.length],
                  animation: `pulse 1.5s ease-in-out ${(i * 0.08 + j * 0.04).toFixed(2)}s infinite`,
                }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </TableBody>
  )
}
