import { useState } from 'react'
import { isSupabaseConfigured } from './lib/supabase'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import SignIn from './auth/SignIn'
import Layout from './components/Layout'
import { modules, defaultModuleId } from './modules/registry'

function SetupNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card max-w-lg bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title">
            <span className="text-primary">Life</span>&nbsp;app — setup needed
          </h1>
          <p className="text-sm">
            Supabase isn't configured yet. Copy <code className="badge badge-ghost">.env.example</code> to{' '}
            <code className="badge badge-ghost">.env</code> and fill in{' '}
            <code className="badge badge-ghost">VITE_SUPABASE_URL</code> and{' '}
            <code className="badge badge-ghost">VITE_SUPABASE_ANON_KEY</code> from your Supabase
            project settings, then restart the dev server. See the README for details.
          </p>
        </div>
      </div>
    </div>
  )
}

function AppShell() {
  const { session, loading } = useAuth()
  const [activeModuleId, setActiveModuleId] = useState(defaultModuleId)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  if (!session) return <SignIn />

  const active = modules.find((m) => m.id === activeModuleId && m.component) ?? modules[0]
  const ActiveComponent = active.component!

  return (
    <Layout activeModuleId={active.id} onSelectModule={setActiveModuleId}>
      <ActiveComponent />
    </Layout>
  )
}

export default function App() {
  if (!isSupabaseConfigured) return <SetupNotice />
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
