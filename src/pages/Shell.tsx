import { EngineProvider, useEngine } from '../app/EngineContext'
import { ActivityLog } from '../components/ActivityLog'
import { AgentPanel } from '../components/AgentPanel'
import { ApprovalPanel } from '../components/ApprovalPanel'
import { SideNav } from '../components/SideNav'
import { TopBar } from '../components/TopBar'
import { usePath } from '../router'
import { Analytics } from './Analytics'
import { Orders } from './Orders'
import { Overview } from './Overview'
import { Products } from './Products'

function Section() {
  const path = usePath()
  const { loading, error } = useEngine()

  if (error) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">{error}</p>
  }
  if (loading) {
    return <p className="p-6 text-xs text-neutral-400">Loading Northwind&rsquo;s data into this tab…</p>
  }
  if (path === '/app/orders') return <Orders />
  if (path === '/app/products') return <Products />
  if (path === '/app/analytics') return <Analytics />
  return <Overview />
}

function Layout() {
  const { ctx } = useEngine()
  return (
    <div className="flex h-screen flex-col bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <SideNav />
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <Section />
        </main>
        <aside className="flex w-[360px] shrink-0 flex-col border-l border-neutral-200 dark:border-neutral-800">
          <ApprovalPanel />
          <div className="min-h-0 flex-1">
            <AgentPanel ctx={ctx} />
          </div>
          <div className="h-[34%] min-h-[160px]">
            <ActivityLog />
          </div>
        </aside>
      </div>
    </div>
  )
}

export function Shell() {
  return (
    <EngineProvider>
      <Layout />
    </EngineProvider>
  )
}
