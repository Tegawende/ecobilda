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
  Mail,
  Sun,
  Moon,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useAdminQuery } from '@/hooks/useAdminQuery';
import { api } from '@convex/_generated/api';
import { cn } from '@/lib/utils';

export function Layout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Reactive unread contact count
  const unreadContacts = useAdminQuery(api.admin.contacts.unreadCount as any) as number | undefined;

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
    { name: t('nav.contacts'), href: '/contacts', icon: Mail },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Sidebar colors per theme
  const sidebarBg = isDark ? 'hsl(var(--background))' : '#ffffff';
  const sidebarBorder = isDark ? 'hsl(var(--border))' : '#e5e7eb';
  const navItemBase = isDark
    ? 'text-white/70 hover:text-white hover:bg-white/10'
    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
  const navItemActive = isDark
    ? 'bg-eco-primary text-white'
    : 'bg-eco-primary/10 text-eco-primary font-semibold';
  const dividerColor = isDark ? 'border-white/10' : 'border-gray-200';
  const nameColor = isDark ? 'text-white' : 'text-gray-900';
  const emailColor = isDark ? 'text-white/50' : 'text-gray-400';
  const avatarBg = isDark ? 'bg-white/10' : 'bg-eco-primary/10';
  const avatarText = isDark ? 'text-white' : 'text-eco-primary';
  const userCardHover = isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100';

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 w-64 border-r transition-colors duration-200"
        style={{ backgroundColor: sidebarBg, borderColor: sidebarBorder }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn('flex items-center px-6 py-4 border-b', dividerColor)}>
            <img src="/logo-white.png" alt="Ecobilda" className="h-9 w-auto" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const badge = item.href === '/contacts' && (unreadContacts ?? 0) > 0 ? (unreadContacts ?? 0) : 0;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive ? navItemActive : navItemBase
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.name}</span>
                  {badge > 0 && (
                    <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-blue-500 text-white text-xs font-bold">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Theme toggle */}
          <div className={cn('px-4 pb-2 border-t', dividerColor)}>
            <button
              onClick={toggleTheme}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 mt-2 rounded-lg text-sm font-medium transition-colors',
                isDark
                  ? 'text-white/60 hover:text-white hover:bg-white/10'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>

          {/* User info */}
          <div className={cn('p-4 border-t relative', dividerColor)} ref={userMenuRef}>
            {/* Dropdown menu (appears above the user card) */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  {t('nav.settings')}
                </Link>
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav.logout')}
                </button>
              </div>
            )}
            {/* User card (clickable) */}
            <button
              className={cn(
                'flex items-center gap-3 w-full text-left rounded-lg p-2 transition-colors',
                userCardHover
              )}
              onClick={() => setUserMenuOpen((prev) => !prev)}
            >
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', avatarBg)}>
                <span className={cn('font-semibold text-sm', avatarText)}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', nameColor)}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className={cn('text-xs truncate', emailColor)}>
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
