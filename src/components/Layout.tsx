import type { ReactNode } from 'react'
import { modules, type LifeModule } from '../modules/registry'

interface LayoutProps {
  activeModuleId: string
  onSelectModule: (id: string) => void
  children: ReactNode
}

export default function Layout({ activeModuleId, onSelectModule, children }: LayoutProps) {
  const renderModuleLink = (mod: LifeModule) => (
    <li key={mod.id}>
      <button
        type="button"
        className={`flex items-center gap-3 ${mod.id === activeModuleId ? 'menu-active' : ''} ${
          mod.status === 'coming-soon' ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={() => mod.status === 'active' && onSelectModule(mod.id)}
        disabled={mod.status === 'coming-soon'}
      >
        <span className="text-lg">{mod.icon}</span>
        <span className="flex-1 text-left">{mod.name}</span>
        {mod.status === 'coming-soon' && <span className="badge badge-ghost badge-xs">soon</span>}
      </button>
    </li>
  )

  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-200">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        <header className="navbar bg-base-100 shadow-sm lg:hidden">
          <label htmlFor="app-drawer" className="btn btn-square btn-ghost" aria-label="Open menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
          <span className="text-lg font-semibold px-2">
            <span className="text-primary">Life</span> app
          </span>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-3xl w-full mx-auto">{children}</main>
      </div>

      <aside className="drawer-side">
        <label htmlFor="app-drawer" aria-label="Close menu" className="drawer-overlay" />
        <div className="menu bg-base-100 min-h-full w-64 p-4 flex flex-col">
          <div className="px-2 pb-4 text-xl font-bold">
            <span className="text-primary">Life</span> app
          </div>

          <ul className="menu w-full p-0 gap-1 flex-1">{modules.map(renderModuleLink)}</ul>
        </div>
      </aside>
    </div>
  )
}
