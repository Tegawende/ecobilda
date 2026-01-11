import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Burger, Container, Group, Menu, Avatar, Drawer, Stack, Divider, Anchor, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconUser,
  IconHeart,
  IconCompass,
  IconMail,
  IconSettings,
  IconFolder,
  IconLogout,
} from '@tabler/icons-react';
import { isAuthenticated, clearAuthTokens } from '../../services/api';
import { profileService } from '../../services/profile';
import { NotificationBell } from './NotificationBell';
import classes from './Navbar.module.css';
import type { User } from '../../types';

const links: Array<{ link: string; label: string }> = [];

export function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const isLoggedIn = isAuthenticated();
  const [opened, { toggle, close }] = useDisclosure(false);
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check if we're on the home page
  const isHomePage = location.pathname === '/';

  // Fetch user profile for avatar
  useEffect(() => {
    if (isLoggedIn) {
      profileService.getProfile()
        .then(user => setCurrentUser(user))
        .catch(err => console.error('Failed to fetch profile:', err));
    } else {
      setCurrentUser(null);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    if (isHomePage) {
      window.addEventListener('scroll', handleScroll);
      // Initialize scroll state
      handleScroll();
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      setScrolled(true);
    }
  }, [isHomePage]);

  const handleLogout = () => {
    // For now, just clear local tokens without API call (mock mode)
    // TODO: Re-enable API call when backend is ready
    clearAuthTokens();
    setCurrentUser(null);
    // Force redirect to landing page using window.location to ensure full page reload
    window.location.href = '/';
  };

  // Transparent only on Home Page AND when not scrolled
  const isTransparent = isHomePage && !scrolled;

  const items = links.map((link) => (
    <Link
      key={link.label}
      to={link.link}
      className={classes.link}
      data-active={active === link.link || undefined}
      onClick={() => {
        setActive(link.link);
        close();
      }}
      style={{
        color: isTransparent ? 'white' : undefined,
      }}
    >
      {link.label}
    </Link>
  ));

  return (
    <div
      className={`h-16 w-full transition-all duration-300 ${isTransparent
        ? 'bg-transparent'
        : 'bg-white/95 backdrop-blur-md shadow-sm'
        }`}
    >
      <Container size="xl" className="h-full">
        <div className="flex justify-between items-center h-full px-4 sm:px-0">
          <Link
            to={isLoggedIn ? '/projects' : '/'}
            className="flex items-center no-underline gap-2 z-50 relative"
          >
            {/* Logo handling: White logo on transparent bg. Invert color (black/dark) on white bg */}
            <img
              src={isTransparent ? "/images/logo-white.png" : "/images/logo-black.png"}
              alt="Ecobilda"
              className="h-14 w-auto object-contain transition-all duration-300"
            />
          </Link>

          <Group gap={5} visibleFrom="xs">
            {items}
          </Group>

          <Group gap="xs">
            {/* "Browse Projects" button - visible to all */}
            <Link
              to="/projects"
              className={`text-sm font-semibold px-6 py-2.5 rounded-full transition-all hidden sm:block shadow-lg hover:-translate-y-0.5 bg-eco-primary text-white hover:bg-eco-primaryDark shadow-eco-primary/20 border border-transparent ${location.pathname === '/projects' ? 'ring-2 ring-eco-primary ring-offset-2' : ''}`}
            >
              {t('home.hero.browseProjects') || "Parcourir les projets"}
            </Link>

            {isLoggedIn ? (
              <>
                <NotificationBell />
                <Menu shadow="md" width={220} position="bottom-end">
                  <Menu.Target>
                    <Avatar
                      src={currentUser?.profile_picture || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face'}
                      color="eco-primary"
                      radius="xl"
                      size="md"
                      style={{ cursor: 'pointer', border: '2px solid transparent' }}
                      className="bg-eco-primary text-white hover:ring-2 hover:ring-eco-primary/50 transition-all"
                    >
                      {!currentUser?.profile_picture && <IconUser size={20} />}
                    </Avatar>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item component={Link} to="/favorites" leftSection={<IconHeart size={16} />}>
                      {t('nav.userMenu.favorites')}
                    </Menu.Item>

                    <Menu.Item component={Link} to="/my-projects" leftSection={<IconFolder size={16} />}>
                      {t('nav.userMenu.myProjects')}
                    </Menu.Item>

                    <Menu.Item component={Link} to="/participations" leftSection={<IconCompass size={16} />}>
                      {t('nav.userMenu.participations')}
                    </Menu.Item>

                    <Menu.Item component={Link} to="/messages" leftSection={<IconMail size={16} />}>
                      {t('nav.userMenu.messages')}
                    </Menu.Item>

                    <Menu.Item component={Link} to="/profile" leftSection={<IconUser size={16} />}>
                      {t('nav.userMenu.profile')}
                    </Menu.Item>

                    <Menu.Item component={Link} to="/settings" leftSection={<IconSettings size={16} />}>
                      {t('nav.userMenu.settings')}
                    </Menu.Item>

                    <Menu.Divider />

                    <Menu.Item leftSection={<IconLogout size={16} />} color="red" onClick={handleLogout}>
                      {t('nav.logout')}
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-sm font-semibold px-6 py-2.5 rounded-full transition-all hidden sm:block shadow-lg hover:-translate-y-0.5 bg-eco-primary text-white hover:bg-eco-primaryDark shadow-eco-primary/20 border border-transparent ${location.pathname === '/login' || location.pathname === '/register' ? 'ring-2 ring-eco-primary ring-offset-2' : ''}`}
                >
                  {t('common.login')}
                </Link>
              </>
            )}

            {/* Hide burger when menu is open to avoid double X visualization through backdrop */}
            <div style={{ opacity: opened ? 0 : 1, transition: 'opacity 200ms ease' }}>
              <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" color={isTransparent ? 'white' : 'black'} />
            </div>
          </Group>
        </div>
      </Container>

      {/* Mobile Drawer - Simplified: Only navbar items, not footer items */}
      <Drawer opened={opened} onClose={close} title="" withCloseButton={false} padding="md" size="md">
        <Stack gap="md">
          <div className="flex justify-between items-center mb-6">
            <Link to="/" onClick={close}>
              <img src="/images/logo-black.png" alt="Ecobilda" className="h-10 w-auto object-contain" />
            </Link>
            <Burger opened={opened} onClick={toggle} size="sm" />
          </div>

          {/* Browse Projects - always visible */}
          {/* Browse Projects - always visible */}
          <Button
            component={Link}
            to="/projects"
            variant="filled"
            color="green"
            size="lg"
            radius="xl"
            fullWidth
            onClick={close}
            className="bg-eco-primary hover:bg-eco-primaryDark"
          >
            {t('home.hero.browseProjects')}
          </Button>

          {isLoggedIn ? (
            <>
              {/* Only show navbar user menu items, not footer links */}
              <Stack gap="xs">
                <Anchor component={Link} to="/favorites" onClick={close} className="py-2">
                  <Group gap="xs">
                    <IconHeart size={20} />
                    {t('nav.userMenu.favorites')}
                  </Group>
                </Anchor>
                <Anchor component={Link} to="/my-projects" onClick={close} className="py-2">
                  <Group gap="xs">
                    <IconFolder size={20} />
                    {t('nav.userMenu.myProjects')}
                  </Group>
                </Anchor>
                <Anchor component={Link} to="/participations" onClick={close} className="py-2">
                  <Group gap="xs">
                    <IconCompass size={20} />
                    {t('nav.userMenu.participations')}
                  </Group>
                </Anchor>
                <Anchor component={Link} to="/messages" onClick={close} className="py-2">
                  <Group gap="xs">
                    <IconMail size={20} />
                    {t('nav.userMenu.messages')}
                  </Group>
                </Anchor>
                <Anchor component={Link} to="/profile" onClick={close} className="py-2">
                  <Group gap="xs">
                    <IconUser size={20} />
                    {t('nav.userMenu.profile')}
                  </Group>
                </Anchor>
                <Anchor component={Link} to="/settings" onClick={close} className="py-2">
                  <Group gap="xs">
                    <IconSettings size={20} />
                    {t('nav.userMenu.settings')}
                  </Group>
                </Anchor>
                <Divider />
                <Button color="red" variant="light" leftSection={<IconLogout size={16} />} onClick={handleLogout} fullWidth mt="md">
                  {t('nav.logout')}
                </Button>
              </Stack>
            </>
          ) : (
            <Stack gap="md" mt="md">
              <Button
                component={Link}
                to="/login"
                variant="filled"
                color="green"
                size="lg"
                radius="xl"
                fullWidth
                onClick={close}
                className="bg-eco-primary hover:bg-eco-primaryDark"
              >
                {t('common.login')}
              </Button>
            </Stack>
          )}
        </Stack>
      </Drawer>
    </div>
  );
}
