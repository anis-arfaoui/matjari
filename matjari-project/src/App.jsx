import { useEffect, useState } from 'react'
import {
  BarChart3,
  Box,
  ExternalLink,
  Home,
  LogOut,
  PackagePlus,
  Settings,
  ShoppingBag,
  Store,
} from 'lucide-react'
import {
  Navigate,
  NavLink,
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { OrdersPage } from './pages/OrdersPage'
import { ProductFormPage } from './pages/ProductFormPage'
import { ProductsPage } from './pages/ProductsPage'
import { PublicProductPage } from './pages/PublicProductPage'
import { PublicStorePage } from './pages/PublicStorePage'
import { StorePage } from './pages/StorePage'
import { getOrderStats } from './services/products'
import { getMyStore } from './services/stores'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/store', label: 'Store', icon: Store },
  { to: '/products', label: 'Products', icon: Box },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const navigate = useNavigate()
  const { signIn, signUp, isConfigured } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!isConfigured) {
      setError('Add your Supabase URL and anon key to .env before signing in.')
      return
    }

    setSubmitting(true)
    const { error: authError } = isRegister
      ? await signUp({ fullName, email, password, phone })
      : await signIn(email, password)
    setSubmitting(false)

    if (authError) {
      setError(authError.message)
      return
    }

    if (isRegister) {
      setMessage('Account created. Check your email if confirmation is enabled.')
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <main className="grid min-h-screen bg-slate-50 text-slate-950 lg:grid-cols-[1fr_460px]">
      <section className="hidden bg-[#0f3d3e] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <span className="grid size-10 place-items-center rounded-lg bg-white text-[#0f3d3e]">
            M
          </span>
          Matjari
        </div>
        <div className="max-w-xl">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-emerald-100">
            Seller workspace
          </p>
          <h1 className="text-5xl font-semibold leading-tight">
            Launch product pages and manage Algerian store orders.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-emerald-50/85">
            A focused MVP for sellers who need store setup, product pages, and
            order follow-up without a heavy page builder.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm text-emerald-50/85">
          <Metric value="1 store" label="per seller" />
          <Metric value="5 statuses" label="order workflow" />
          <Metric value="1 template" label="landing page" />
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-6 flex items-center gap-3 text-lg font-semibold">
              <span className="grid size-10 place-items-center rounded-lg bg-[#0f3d3e] text-white">
                M
              </span>
              Matjari
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {isRegister
                ? 'Start with seller access. Store setup comes next.'
                : 'Sign in to manage your store workspace.'}
            </p>

            {!isConfigured && (
              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Supabase is not configured yet. Copy `.env.example` to `.env`
                and add your project keys.
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {isRegister && (
                <>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Full name
                    </span>
                    <input
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Phone number
                    </span>
                    <input
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      required
                    />
                  </label>
                </>
              )}
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Email
                </span>
                <input
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Password
                </span>
                <input
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                  type="password"
                  value={password}
                  minLength={6}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {message && <p className="text-sm text-emerald-700">{message}</p>}

              <button
                className="flex w-full items-center justify-center rounded-md bg-[#0f3d3e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#155153] disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? 'Please wait...'
                  : isRegister
                    ? 'Create account'
                    : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {isRegister ? 'Already have an account?' : 'New to Matjari?'}{' '}
              <NavLink
                className="font-semibold text-[#0f3d3e] hover:underline"
                to={isRegister ? '/login' : '/register'}
              >
                {isRegister ? 'Sign in' : 'Create account'}
              </NavLink>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function Metric({ value, label }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-4">
      <p className="text-xl font-semibold">{value}</p>
      <p>{label}</p>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading, isConfigured } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-500">
        Loading workspace...
      </div>
    )
  }

  if (!isConfigured || !user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppLayout() {
  const { signOut, user } = useAuth()
  const [store, setStore] = useState(null)
  const [storeLoading, setStoreLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadStore() {
      try {
        const nextStore = await getMyStore()

        if (mounted) {
          setStore(nextStore)
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (mounted) {
          setStoreLoading(false)
        }
      }
    }

    loadStore()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <span className="grid size-9 place-items-center rounded-lg bg-[#0f3d3e] font-semibold text-white">
            M
          </span>
          <span className="font-semibold">Matjari</span>
        </div>
        <SidebarStore store={store} storeLoading={storeLoading} />
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <p className="truncate text-sm font-medium">{user?.email}</p>
          <button
            className="mt-3 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            type="button"
            onClick={() => signOut()}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 font-semibold">
              <span className="grid size-9 place-items-center rounded-lg bg-[#0f3d3e] text-white">
                M
              </span>
              Matjari
            </div>
            <button
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              type="button"
              onClick={() => signOut()}
            >
              Logout
            </button>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <MobileLink key={item.to} {...item} />
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route
              index
              element={<Dashboard store={store} storeLoading={storeLoading} />}
            />
            <Route
              path="store"
              element={
                <StorePage
                  onStoreCreated={setStore}
                  store={store}
                  storeLoading={storeLoading}
                  user={user}
                />
              }
            />
            <Route path="products" element={<ProductsPage store={store} />} />
            <Route path="products/new" element={<ProductFormPage store={store} />} />
            <Route
              path="products/:productId/edit"
              element={<ProductFormPage store={store} />}
            />
            <Route path="orders" element={<OrdersPage store={store} />} />
            <Route
              path="settings"
              element={<PhasePlaceholder type="settings" />}
            />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function SidebarStore({ store, storeLoading }) {
  if (storeLoading) {
    return (
      <div className="border-b border-slate-200 p-4">
        <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="border-b border-slate-200 p-4">
        <NavLink
          className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm transition hover:border-[#0f3d3e] hover:bg-emerald-50/60"
          to="/store"
        >
          <span className="font-semibold text-slate-950">Create store</span>
          <span className="mt-1 block text-slate-500">No store yet</span>
        </NavLink>
      </div>
    )
  }

  return (
    <div className="border-b border-slate-200 p-4">
      <NavLink
        className="block rounded-lg bg-slate-50 p-4 text-center transition hover:bg-emerald-50/70"
        to="/store"
      >
        <span className="mx-auto grid size-16 place-items-center overflow-hidden rounded-lg bg-emerald-50 text-xl font-semibold text-[#0f3d3e]">
          {store.logo_url ? (
            <img
              className="h-full w-full object-cover"
              src={store.logo_url}
              alt=""
            />
          ) : (
            store.name.charAt(0).toUpperCase()
          )}
        </span>
        <span className="mt-3 block truncate font-semibold text-slate-950">
          {store.name}
        </span>
        <span className="mt-1 block truncate text-xs text-slate-500">
          /{store.slug}
        </span>
      </NavLink>
      <a
        className="mt-3 flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-[#0f3d3e] hover:text-[#0f3d3e]"
        href={`${window.location.origin}/s/${store.slug}`}
        target="_blank"
        rel="noreferrer"
      >
        <ExternalLink size={14} />
        View store
      </a>
    </div>
  )
}

function SidebarLink({ to, label, icon: Icon }) {
  return (
    <NavLink
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
          isActive
            ? 'bg-emerald-50 text-[#0f3d3e]'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
        ].join(' ')
      }
      to={to}
      end={to === '/'}
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}

function MobileLink({ to, label, icon: Icon }) {
  return (
    <NavLink
      className={({ isActive }) =>
        [
          'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm',
          isActive
            ? 'bg-emerald-50 text-[#0f3d3e]'
            : 'bg-slate-100 text-slate-600',
        ].join(' ')
      }
      to={to}
      end={to === '/'}
    >
      <Icon size={16} />
      {label}
    </NavLink>
  )
}

function Dashboard({ store, storeLoading }) {
  const [stats, setStats] = useState({ total: 0, new: 0, delivered: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadStats() {
      if (!store) {
        setStatsLoading(false)
        return
      }

      try {
        const nextStats = await getOrderStats(store.id)
        if (mounted) {
          setStats(nextStats)
        }
      } catch (statsError) {
        console.error(statsError)
      } finally {
        if (mounted) {
          setStatsLoading(false)
        }
      }
    }

    loadStats()

    return () => {
      mounted = false
    }
  }, [store])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Dashboard"
        description={
          store
            ? `Store: ${store.name}`
            : 'Create your store to unlock products and orders.'
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total orders"
          value={statsLoading ? '—' : stats.total}
        />
        <StatCard label="New orders" value={statsLoading ? '—' : stats.new} />
        <StatCard
          label="Delivered orders"
          value={statsLoading ? '—' : stats.delivered}
        />
      </div>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-emerald-50 text-[#0f3d3e]">
            <PackagePlus size={22} />
          </span>
          <div>
            <h2 className="text-lg font-semibold">
              {store ? 'Store is ready' : 'Create your store'}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              {storeLoading
                ? 'Checking your store...'
                : store
                  ? `Your store link is /${store.slug}.`
                  : 'Set up your store name, link, and logo before adding products.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  )
}

function PhasePlaceholder({ type }) {
  const copy = {
    store: ['Store Management', 'Create and edit one seller store.'],
    products: ['Product Management', 'Add products, images, prices, and slugs.'],
    orders: ['Order Management', 'View orders, filter, and update statuses.'],
    settings: ['Settings', 'Manage store name, logo, and subdomain.'],
  }
  const [title, description] = copy[type]

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Upcoming phase" title={title} description={description} />
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <BarChart3 className="mx-auto text-slate-300" size={38} />
        <p className="mx-auto mt-4 max-w-md text-sm text-slate-500">
          This area is intentionally waiting for its feature phase so the MVP
          stays simple and testable as it grows.
        </p>
      </div>
    </div>
  )
}

function PageHeader({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f3d3e]">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route
          path="/s/:storeSlug/:productSlug"
          element={<PublicProductPage />}
        />
        <Route path="/s/:storeSlug" element={<PublicStorePage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
