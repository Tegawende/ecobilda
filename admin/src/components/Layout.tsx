import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  FolderCheck,
  Flag,
  Users,
  LogOut,
  Settings,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function Layout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('nav.projectsValidation'), href: '/projects', icon: FolderCheck },
    { name: t('nav.reports'), href: '/reports', icon: Flag },
    { name: t('nav.users'), href: '/users', icon: Users },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-4 border-b">
            <img src="/logo-black.png" alt="Ecobilda" className="h-8 w-auto" />
            <div>
              <h1 className="font-bold text-lg">Ecobilda</h1>
              <p className="text-xs text-muted-foreground">{t('nav.adminPanel')}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-eco-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t relative" ref={userMenuRef}>
            {/* Dropdown menu (appears above the user card) */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  {t('nav.settings')}
                </Link>
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav.logout')}
                </button>
              </div>
            )}
            {/* User card (clickable) */}
            <button
              className="flex items-center gap-3 w-full text-left rounded-lg p-2 hover:bg-gray-100 transition-colors"
              onClick={() => setUserMenuOpen((prev) => !prev)}
            >
              <div className="w-10 h-10 rounded-full bg-eco-primary/10 flex items-center justify-center shrink-0">
                <span className="text-eco-primary font-semibold">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        <div className="p-8"><Outlet /></div>
      </main>
    </div>
  );
}
