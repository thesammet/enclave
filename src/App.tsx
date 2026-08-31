import { Landing } from './pages/Landing'
import { Workbench } from './pages/Workbench'
import { usePath } from './router'

export default function App() {
  return usePath() === '/app' ? <Workbench /> : <Landing />
}
