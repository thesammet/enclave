import { useEngine } from '../app/EngineContext'
import { useQuery } from '../components/useQuery'
import { useCommerce } from '../store/commerce'

const SQL = `SELECT product_id, name, category, supplier, price, stock, reorder_level
  FROM products ORDER BY stock - reorder_level ASC`

export function Products() {
  const { engine } = useEngine()
  const version = useCommerce((s) => s.version)
  const rows = useQuery(SQL, engine, version)

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold tracking-tight">Products</h1>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-[#fcfcfb] dark:border-neutral-800 dark:bg-[#1a1a19]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-neutral-200 text-neutral-400 dark:border-neutral-800">
            <tr>
              {['SKU', 'Product', 'Category', 'Supplier', 'Price', 'Stock'].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.data?.rows.map((r) => {
              const stock = Number(r[5])
              const reorder = Number(r[6])
              const low = stock <= reorder
              return (
                <tr
                  key={String(r[0])}
                  className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
                >
                  <td className="px-3 py-2 font-mono text-[11px] text-neutral-500">{String(r[0])}</td>
                  <td className="px-3 py-2 text-neutral-900 dark:text-neutral-100">{String(r[1])}</td>
                  <td className="px-3 py-2 text-neutral-500">{String(r[2])}</td>
                  <td className="px-3 py-2 text-neutral-500">{String(r[3])}</td>
                  <td className="px-3 py-2 tabular-nums">{Number(r[4]).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`tabular-nums ${
                          low ? 'text-amber-600 dark:text-amber-500' : ''
                        }`}
                      >
                        {stock}
                      </span>
                      <span className="text-[10px] text-neutral-400">/ {reorder}</span>
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div
                          className={`h-full ${low ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, (stock / (reorder * 2)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.loading && <p className="p-4 text-xs text-neutral-400">Loading…</p>}
      </div>
    </div>
  )
}
