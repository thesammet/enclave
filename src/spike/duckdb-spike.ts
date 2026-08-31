import * as duckdb from '@duckdb/duckdb-wasm'

export async function spike(): Promise<string> {
  const bundles = duckdb.getJsDelivrBundles()
  const bundle = await duckdb.selectBundle(bundles)
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' }),
  )
  const worker = new Worker(workerUrl)
  const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker)
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
  URL.revokeObjectURL(workerUrl)

  const csv = 'region,amount\nEMEA,10\nEMEA,15\nAPAC,7\n'
  await db.registerFileText('spike.csv', csv)
  const conn = await db.connect()
  await conn.insertCSVFromPath('spike.csv', { name: 'raw', detect: true, header: true })
  const res = await conn.query(
    'SELECT region, sum(amount) AS total FROM raw GROUP BY region ORDER BY total DESC',
  )
  const rows = res.toArray().map((r) => r.toJSON())
  await conn.close()

  const kind = bundle.mainModule.includes('coi')
    ? 'coi'
    : bundle.mainModule.includes('eh')
      ? 'eh'
      : 'mvp'
  return `bundle=${kind} crossOriginIsolated=${crossOriginIsolated} rows=${JSON.stringify(
    rows,
    (_k, v) => (typeof v === 'bigint' ? Number(v) : v),
  )}`
}
