import { useState } from 'react'
import Layout from './components/Layout'
import { modules, defaultModuleId } from './modules/registry'

export default function App() {
  const [activeModuleId, setActiveModuleId] = useState(defaultModuleId)

  const active = modules.find((m) => m.id === activeModuleId && m.component) ?? modules[0]
  const ActiveComponent = active.component!

  return (
    <Layout activeModuleId={active.id} onSelectModule={setActiveModuleId}>
      <ActiveComponent />
    </Layout>
  )
}
