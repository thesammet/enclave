import ReactECharts from 'echarts-for-react'
import { useEngine } from '../app/EngineContext'
import { usePalette } from '../charts/palette'
import { StatTile } from '../components/StatTile'
import { useQuery } from '../components/useQuery'
import { useCommerce } from '../store/commerce'

const money = (n: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    .format(n)

const TOTALS = `SELECT round(sum(revenue)) AS revenue, count(*) AS orders,
       round(sum(revenue) / count(*), 2) AS avg_order
  FROM orders WHERE status = 'fulfilled'`

const LOW_STOCK = `SELECT product_id, name, supplier, stock, reorder_level
  FROM products WHERE stock <= reorder_level ORDER BY stock - reorder_level ASC`

const BY_MONTH = `SELECT strftime(order_date, '%Y-%m') AS month, region,
       round(sum(revenue)) AS revenue
  FROM orders WHERE status = 'fulfilled' AND order_date >= '2025-01-01'
  GROUP BY 1, 2 ORDER BY 1`

export function Overview() {
  const { engine } = useEngine()
  const version = useCommerce((s) => s.version)
  const restocks = useCommerce((s) => s.restockOrders)
  const p = usePalette()

  const totals = useQuery(TOTALS, engine, version)
  const low = useQuery(LOW_STOCK, engine, version)
  const months = useQuery(BY_MONTH, engine, version)

  const t = totals.data?.rows[0]
  const regions = months.data ? [...new Set(months.data.rows.map((r) => String(r[1])))] : []

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, textStyle: { color: p.textSecondary, fontSize: 11 } },
    grid: { left: 56, right: 16, top: 34, bottom: 30 },
    xAxis: {
      type: 'category',
      axisTick: { show: false },
      axisLine: { lineStyle: { color: p.grid } },
      axisLabel: { color: p.axis, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: p.axis, fontSize: 11 },
      splitLine: { lineStyle: { color: p.grid } },
    },
    series: regions.map((region, i) => ({
      name: region,
      type: 'line',
      showSymbol: false,
      lineStyle: { width: 2 },
      itemStyle: { color: p.series[i] },
      data: months.data!.rows
        .filter((r) => String(r[1]) === region)
        .map((r) => [String(r[0]), Number(r[2])]),
    })),
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold tracking-tight">Overview</h1>

      <div className="grid grid-cols-4 gap-3">
        <StatTile label="Revenue" value={t ? money(Number(t[0])) : '—'} hint="fulfilled orders" />
        <StatTile
          label="Orders"
          value={t ? Number(t[1]).toLocaleString() : '—'}
          hint="all time"
        />
        <StatTile label="Average order" value={t ? money(Number(t[2])) : '—'} />
        <StatTile
          label="Below reorder level"
          value={low.data ? String(low.data.rows.length) : '—'}
          hint={low.data?.rows.length ? 'needs restocking' : 'catalogue healthy'}
          tone={low.data?.rows.length ? 'warning' : undefined}
        />
      </div>

      <section className="rounded-lg border border-neutral-200 bg-[#fcfcfb] p-4 dark:border-neutral-800 dark:bg-[#1a1a19]">
        <h2 className="text-sm font-medium">Revenue by region, 2025</h2>
        {months.data ? (
          <ReactECharts option={option} style={{ height: 240 }} notMerge lazyUpdate />
        ) : (
          <p className="py-16 text-xs text-neutral-400">Loading…</p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-5">
        <section className="rounded-lg border border-neutral-200 bg-[#fcfcfb] p-4 dark:border-neutral-800 dark:bg-[#1a1a19]">
          <h2 className="text-sm font-medium">Low stock</h2>
          {low.data?.rows.length ? (
            <table className="mt-2 w-full text-left text-xs">
              <thead>
                <tr className="text-neutral-400">
                  <th className="py-1 font-medium">Product</th>
                  <th className="py-1 font-medium">Supplier</th>
                  <th className="py-1 text-right font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {low.data.rows.map((r) => (
                  <tr key={String(r[0])} className="border-t border-neutral-100 dark:border-neutral-900">
                    <td className="py-1.5 text-neutral-800 dark:text-neutral-200">{String(r[1])}</td>
                    <td className="py-1.5 text-neutral-500">{String(r[2])}</td>
                    <td className="py-1.5 text-right tabular-nums text-amber-600 dark:text-amber-500">
                      {String(r[3])} / {String(r[4])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-6 text-xs text-neutral-400">Nothing below its reorder level.</p>
          )}
        </section>

        <section className="rounded-lg border border-neutral-200 bg-[#fcfcfb] p-4 dark:border-neutral-800 dark:bg-[#1a1a19]">
          <h2 className="text-sm font-medium">Restock orders</h2>
          {restocks.length ? (
            <ul className="mt-2 space-y-1.5 text-xs">
              {restocks.map((o) => (
                <li key={o.id} className="flex items-baseline gap-2">
                  <code className="text-neutral-900 dark:text-neutral-100">{o.id}</code>
                  <span className="truncate text-neutral-600 dark:text-neutral-400">
                    {o.quantity} × {o.productName}
                  </span>
                  <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-neutral-400">
                    raised by {o.createdBy}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-xs text-neutral-400">
              None yet. The agent can raise one — you approve it before it takes effect.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
