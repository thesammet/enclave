import { useEffect, useState } from 'react'
import { DuckDbEngine } from './data/duckdb-engine'

const CSV = 'region,amount\nEMEA,10\nEMEA,15\nAPAC,7\n'

export default function App() {
  const [out, setOut] = useState('running…')
  useEffect(() => {
    ;(async () => {
      const e = new DuckDbEngine()
      const schema = await e.loadCsv('t.csv', CSV)
      const all = await e.query(
        'SELECT region, sum(amount) AS total FROM data GROUP BY region ORDER BY total DESC',
      )
      await e.setFilter("region = 'EMEA'")
      const filtered = await e.query('SELECT region, sum(amount) AS total FROM data GROUP BY region')
      await e.setFilter(null)
      const cleared = await e.query('SELECT count(*) AS n FROM data')
      setOut(
        JSON.stringify(
          { schema, all, filtered, filteredRows: e.getSchema()?.rowCount, cleared },
          null,
          1,
        ),
      )
    })().catch((err) => setOut(`FAILED: ${err.message}`))
  }, [])
  return <pre className="p-8 font-mono text-xs whitespace-pre-wrap">{out}</pre>
}
