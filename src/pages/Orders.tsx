import { useState } from 'react'
import { useEngine } from '../app/EngineContext'
import { useQuery } from '../components/useQuery'
import { useCommerce } from '../store/commerce'

const REGIONS = ['All', 'EMEA', 'AMER', 'APAC', 'LATAM']
const STATUSES = ['All', 'fulfilled', 'refunded', 'cancelled']

function Select({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs outline-none
        dark:border-neutral-700 dark:bg-neutral-900"
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  )
}

export function Orders() {
  const { engine } = useEngine()
  const version = useCommerce((s) => s.version)
  const [region, setRegion] = useState('All')
  const [status, setStatus] = useState('All')

  const where: string[] = []
  if (region !== 'All') where.push(`o.region = '${region}'`)
  if (status !== 'All') where.push(`o.status = '${status}'`)
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const rows = useQuery(
    `SELECT o.order_id, o.order_date, o.region, o.channel, p.name AS product,
            o.units, o.revenue, o.status
       FROM orders o LEFT JOIN products p USING (product_id)
       ${clause} ORDER BY o.order_date DESC LIMIT 200`,
    engine,
    version,
  )
  const count = useQuery(`SELECT count(*) AS n FROM orders o ${clause}`, engine, version)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Orders</h1>
        <span className="text-xs text-neutral-500">
          {count.data ? `${Number(count.data.rows[0][0]).toLocaleString()} matching` : '…'}
        </span>
        <div className="ml-auto flex gap-2">
          <Select value={region} options={REGIONS} onChange={setRegion} />
          <Select value={status} options={STATUSES} onChange={setStatus} />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-[#fcfcfb] dark:border-neutral-800 dark:bg-[#1a1a19]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-neutral-200 text-neutral-400 dark:border-neutral-800">
            <tr>
              {['Order', 'Date', 'Region', 'Channel', 'Product', 'Units', 'Revenue', 'Status'].map(
                (h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.data?.rows.map((r) => (
              <tr
                key={String(r[0])}
                className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
              >
                <td className="px-3 py-1.5 font-mono text-[11px] text-neutral-500">{String(r[0])}</td>
                <td className="px-3 py-1.5 tabular-nums text-neutral-600 dark:text-neutral-400">
                  {String(r[1])}
                </td>
                <td className="px-3 py-1.5">{String(r[2])}</td>
                <td className="px-3 py-1.5 text-neutral-500">{String(r[3])}</td>
                <td className="px-3 py-1.5 text-neutral-800 dark:text-neutral-200">{String(r[4])}</td>
                <td className="px-3 py-1.5 tabular-nums">{String(r[5])}</td>
                <td className="px-3 py-1.5 tabular-nums">{Number(r[6]).toFixed(2)}</td>
                <td className="px-3 py-1.5">
                  <span
                    className={
                      r[7] === 'fulfilled'
                        ? 'text-emerald-600 dark:text-emerald-500'
                        : r[7] === 'refunded'
                          ? 'text-amber-600 dark:text-amber-500'
                          : 'text-neutral-400'
                    }
                  >
                    {String(r[7])}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.loading && <p className="p-4 text-xs text-neutral-400">Loading…</p>}
        {rows.error && <p className="p-4 text-xs text-red-500">{rows.error}</p>}
      </div>
      <p className="text-[11px] text-neutral-400">Showing the 200 most recent matching orders.</p>
    </div>
  )
}
