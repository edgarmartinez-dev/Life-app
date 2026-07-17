import { useState, type FormEvent } from 'react'
import { useAuth } from './AuthProvider'

export default function SignIn() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    const err =
      mode === 'signin' ? await signIn(email, password) : await signUp(email, password)
    setBusy(false)
    if (err) {
      setError(err)
    } else if (mode === 'signup') {
      setNotice('Account created. Check your email if confirmation is required, then sign in.')
      setMode('signin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center mb-2">
            <span className="text-primary">Life</span>&nbsp;app
          </h1>
          <p className="text-center text-base-content/60 text-sm mb-4">
            Everything in your life, organized in one place.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="floating-label">
              <span>Email</span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="floating-label">
              <span>Password</span>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && (
              <div role="alert" className="alert alert-error text-sm py-2">
                {error}
              </div>
            )}
            {notice && (
              <div role="alert" className="alert alert-success text-sm py-2">
                {notice}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={busy}>
              {busy && <span className="loading loading-spinner loading-sm" />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <button
            type="button"
            className="btn btn-ghost btn-sm mt-2"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
              setNotice(null)
            }}
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
