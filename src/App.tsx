import { useEffect, useState } from 'react'
import { spike } from './spike/duckdb-spike'

export default function App() {
  const [out, setOut] = useState('running…')
  useEffect(() => {
    spike()
      .then(setOut)
      .catch((e) => setOut(`FAILED: ${e.message}`))
  }, [])
  return <pre className="p-8 font-mono text-sm whitespace-pre-wrap">{out}</pre>
}
