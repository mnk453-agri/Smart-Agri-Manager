import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronDown,
  ClipboardList,
  Droplets,
  FileText,
  Gauge,
  HandCoins,
  Wheat,
  Landmark,
  LayoutDashboard,
  Leaf,
  Map,
  PackageOpen,
  ReceiptText,
  Settings,
  ShoppingCart,
  Sprout,
  Tractor,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router'

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

type NavigationItem = {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

type NavigationGroup = {
  title: string
  items: NavigationItem[]
}

const navigationGroups: NavigationGroup[] = [
  {
    title: 'Dashboard',
    items: [
      {
        label: 'Overview',
        path: '/',
        icon: LayoutDashboard,
      },
      {
        label: 'Alerts',
        path: '/alerts',
        icon: Gauge,
      },
    ],
  },
  {
    title: 'Farm Setup',
    items: [
      {
        label: 'Lands',
        path: '/lands',
        icon: Map,
      },
      {
        label: 'Farmers',
        path: '/farmers',
        icon: Users,
      },
      {
        label: 'Land Assignments',
        path: '/land-assignments',
        icon: Landmark,
      },
      {
        label: 'Crops',
        path: '/crops',
        icon: Sprout,
      },
      {
        label: 'Suppliers',
        path: '/suppliers',
        icon: Building2,
      },
    ],
  },
  {
    title: 'Transactions',
    items: [
      {
        label: 'Purchases',
        path: '/purchases',
        icon: ShoppingCart,
      },
      {
        label: 'General Expenses',
        path: '/general-expenses',
        icon: ReceiptText,
      },
      {
        label: 'Farmer Ledger',
        path: '/farmer-ledger',
        icon: BookOpen,
      },
      {
        label: 'Diesel & Watering',
        path: '/diesel-watering',
        icon: Droplets,
      },
      {
        label: 'Harvest & Sales',
        path: '/harvest-sales',
        icon: Wheat,
      },
    ],
  },
  {
    title: 'Accounting',
    items: [
      {
        label: 'Crop Profit/Loss',
        path: '/profit-loss',
        icon: BarChart3,
      },
      {
        label: 'Settlements',
        path: '/settlements',
        icon: HandCoins,
      },
      {
        label: 'Supplier Payments',
        path: '/supplier-payments',
        icon: WalletCards,
      },
      {
        label: 'Buyer Receipts',
        path: '/buyer-receipts',
        icon: PackageOpen,
      },
    ],
  },
  {
    title: 'Reports',
    items: [
      {
        label: 'Farmer Reports',
        path: '/reports/farmers',
        icon: ClipboardList,
      },
      {
        label: 'Crop Reports',
        path: '/reports/crops',
        icon: Leaf,
      },
      {
        label: 'Land Reports',
        path: '/reports/lands',
        icon: Tractor,
      },
      {
        label: 'Financial Reports',
        path: '/reports/financial',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Users',
        path: '/users',
        icon: Users,
      },
      {
        label: 'Settings',
        path: '/settings',
        icon: Settings,
      },
    ],
  },
]

function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-emerald-900/10 bg-emerald-950 text-white transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400 text-emerald-950">
              <Sprout className="h-6 w-6" />
            </div>

            <div>
              <p className="text-lg font-bold leading-tight">
                Smart Agri
              </p>
              <p className="text-sm text-emerald-200">
                Manager
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-emerald-100 hover:bg-white/10 lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-6">
            {navigationGroups.map((group) => (
              <section key={group.title}>
                <div className="mb-2 flex items-center justify-between px-3">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
                    {group.title}
                  </p>

                  <ChevronDown className="h-4 w-4 text-emerald-400" />
                </div>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        onClick={onClose}
                        className={({ isActive }) =>
                          [
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                            isActive
                              ? 'bg-emerald-400 text-emerald-950 shadow-sm'
                              : 'text-emerald-50 hover:bg-white/10 hover:text-white',
                          ].join(' ')
                        }
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="font-semibold">
              Version 1.0
            </p>
            <p className="mt-1 text-xs leading-5 text-emerald-200">
              Agricultural cost and crop management system
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar