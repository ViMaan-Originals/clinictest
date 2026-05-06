'use client'

import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()

const navItems = [
  { label: 'Home', href: '/dashboard/home', icon: '🏠' },
  { label: 'Appointments', href: '/dashboard/appointments', icon: '📅' },
  { label: 'Patients', href: '/dashboard/patients', icon: '👥' },
  { label: 'Results', href: '/dashboard/results', icon: '🧪' },
  { label: 'FAQs', href: '/dashboard/faqs', icon: '❓' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
]

  if (pathname === '/dashboard') return children

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F7F9F8; }

        .layout { display: flex; flex-direction: column; min-height: 100vh; }

        .topbar {
          background: white;
          border-bottom: 1px solid #E5E7EB;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .topbar-logo {
          font-family: 'DM Serif Display', serif;
          font-size: 20px;
          color: #0D9488;
        }

        .logout-btn {
          padding: 7px 14px;
          background: #FEF2F2;
          color: #EF4444;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }

        .nav {
          background: white;
          border-bottom: 1px solid #E5E7EB;
          display: flex;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 0 12px;
        }
        .nav::-webkit-scrollbar { display: none; }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 14px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #6B7280;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.15s;
        }

        .nav-item:hover { color: #0D9488; }

        .nav-item.active {
          color: #0D9488;
          border-bottom-color: #0D9488;
          font-weight: 600;
        }

        .main {
          flex: 1;
          max-width: 860px;
          margin: 0 auto;
          width: 100%;
          padding: 28px 20px 48px;
        }

        @keyframes fadeUp { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
        .main { animation: fadeUp 0.25s ease; }
      `}</style>

      <div className="layout">
        <div className="topbar">
          <span className="topbar-logo">ClinicApp</span>
          <button
            className="logout-btn"
            onClick={async () => { await supabase.auth.signOut(); router.push('/dashboard') }}
          >
            Logout
          </button>
        </div>

        <nav className="nav">
          {navItems.map(item => (
            <button
              key={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => router.push(item.href)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <main className="main">
          {children}
        </main>
      </div>
    </>
  )
}