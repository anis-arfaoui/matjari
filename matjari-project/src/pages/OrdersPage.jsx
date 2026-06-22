import { useEffect, useMemo, useState } from 'react'
import { PackageOpen } from 'lucide-react'
import { getStoreOrders, updateOrderStatus } from '../services/products'

const ORDER_STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled']
const FILTER_STATUSES = ['all', ...ORDER_STATUSES]

const STATUS_LABELS = {
  new: 'New',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export function OrdersPage({ store }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    let mounted = true

    async function loadOrders() {
      if (!store) {
        setLoading(false)
        return
      }

      try {
        setError('')
        const data = await getStoreOrders(store.id)
        if (mounted) {
          setOrders(data)
        }
      } catch (orderError) {
        if (mounted) {
          setError(orderError.message)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadOrders()

    return () => {
      mounted = false
    }
  }, [store])

  const filteredOrders = useMemo(() => {
    if (filter === 'all') {
      return orders
    }
    return orders.filter((order) => order.status === filter)
  }, [orders, filter])

  const stats = useMemo(() => {
    const counts = {
      total: orders.length,
      new: 0,
      delivered: 0,
    }

    for (const order of orders) {
      if (order.status === 'new') {
        counts.new += 1
      }
      if (order.status === 'delivered') {
        counts.delivered += 1
      }
    }

    return counts
  }, [orders])

  async function handleStatusChange(orderId, status) {
    setUpdatingId(orderId)

    try {
      const updated = await updateOrderStatus(orderId, status)
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, ...updated } : order))
      )
    } catch (statusError) {
      setError(statusError.message)
    } finally {
      setUpdatingId(null)
    }
  }

  if (!store) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Create a store before managing orders.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f3d3e]">
          Orders
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Orders</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Track and update customer orders.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total orders" value={stats.total} />
        <StatCard label="New orders" value={stats.new} />
        <StatCard label="Delivered orders" value={stats.delivered} />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_STATUSES.map((status) => (
          <button
            key={status}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-medium transition',
              filter === status
                ? 'bg-[#0f3d3e] text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-[#0f3d3e] hover:text-[#0f3d3e]',
            ].join(' ')}
            type="button"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-slate-50 text-slate-300 shadow-sm">
            <PackageOpen size={28} />
          </span>
          <h3 className="mt-5 text-lg font-semibold text-slate-900">
            {orders.length === 0 ? 'No orders yet' : 'No orders for this filter'}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {orders.length === 0
              ? 'Orders will appear here when customers place them on your product pages.'
              : 'Try another status filter.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Wilaya</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        #{order.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDate(order.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-100 text-slate-400">
                          {order.products?.main_image_url ? (
                            <img
                              className="h-full w-full object-cover"
                              src={order.products.main_image_url}
                              alt=""
                            />
                          ) : (
                            order.products?.title?.charAt(0).toUpperCase() || '?'
                          )}
                        </span>
                        <span className="max-w-[180px] truncate font-medium text-slate-900">
                          {order.products?.title || 'Unknown product'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {order.customer_name}
                      </div>
                      <div className="text-xs text-slate-500">{order.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {order.wilaya_name}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className={[
                          'rounded-md border px-2 py-1 text-xs font-medium outline-none',
                          statusBadgeClass(order.status),
                          updatingId === order.id
                            ? 'cursor-not-allowed opacity-60'
                            : '',
                        ].join(' ')}
                        value={order.status}
                        onChange={(event) =>
                          handleStatusChange(order.id, event.target.value)
                        }
                        disabled={updatingId === order.id}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {formatPrice(order.quantity * (order.products?.current_price || 0))}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.quantity} × {formatPrice(order.products?.current_price || 0)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <select
                    className={[
                      'rounded-md border px-2 py-1 text-xs font-medium outline-none',
                      statusBadgeClass(order.status),
                      updatingId === order.id
                        ? 'cursor-not-allowed opacity-60'
                        : '',
                    ].join(' ')}
                    value={order.status}
                    onChange={(event) =>
                      handleStatusChange(order.id, event.target.value)
                    }
                    disabled={updatingId === order.id}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-100 text-slate-400">
                    {order.products?.main_image_url ? (
                      <img
                        className="h-full w-full object-cover"
                        src={order.products.main_image_url}
                        alt=""
                      />
                    ) : (
                      order.products?.title?.charAt(0).toUpperCase() || '?'
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {order.products?.title || 'Unknown product'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.quantity} × {formatPrice(order.products?.current_price || 0)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-slate-50 p-2">
                    <p className="text-xs text-slate-500">Customer</p>
                    <p className="font-medium text-slate-900">{order.customer_name}</p>
                    <p className="text-xs text-slate-600">{order.phone}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-2">
                    <p className="text-xs text-slate-500">Delivery</p>
                    <p className="font-medium text-slate-900">
                      {order.delivery_method === 'home' ? 'Home' : 'Office'}
                    </p>
                    <p className="text-xs text-slate-600">{order.wilaya_name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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

function statusBadgeClass(status) {
  const classes = {
    new: 'bg-blue-50 text-blue-700 border-blue-200',
    confirmed: 'bg-amber-50 text-amber-700 border-amber-200',
    shipped: 'bg-purple-50 text-purple-700 border-purple-200',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
  }
  return classes[status] || 'bg-slate-50 text-slate-700 border-slate-200'
}

function formatDate(value) {
  if (!value) {
    return '—'
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatPrice(value) {
  if (value === null || value === undefined) {
    return '—'
  }
  return `${Number(value).toLocaleString()} DZD`
}
