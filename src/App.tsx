import { Landing } from './pages/Landing'
import { Shell } from './pages/Shell'
import { usePath } from './router'

export default function App() {
  return usePath().startsWith('/app') ? <Shell /> : <Landing />
}
