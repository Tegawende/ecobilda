'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { Burger, Group, Menu, Avatar, Drawer, Stack, Divider, Anchor, Button } from '@mantine/core';
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
import { useAuth } from '@/providers/AuthProvider';
import { NotificationBell } from './NotificationBell';

export function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [opened, { toggle, close }] = useDisclosure(false);
  const [scrolled, setScrolled] = useState(false);

  // Check if we're on the home page
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    if (isHomePage) {
      window.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      setScrolled(true);
    }
  }, [isHomePage]);

  const handleLogout = () => {
    logout();
  };

  // Transparent only on Home Page AND when not scrolled
  const isTransparent = isHomePage && !scrolled;

  return (
    <div
      className={`h-16 w-full transition-all duration-300 ${isTransparent
        ? 'bg-transparent'
        : 'bg-white/95 backdrop-blur-md shadow-sm'
        }`}
    >
      <div className="h-full w-full px-4 sm:px-8 lg:px-12">
        <Group justify="space-between" h="100%">
          <Link
            href={isAuthenticated ? '/projects' : '/'}
            className="flex items-center no-underline gap-2 z-50 relative"
          >
            <img
              src="/images/logo-white.png"
              alt="Ecobilda"
              className="h-14 w-auto object-contain transition-all duration-300"
            />
          </Link>

          <Group gap="xs">
            {/* "Learn from others" — hidden on landing page; pill button when authenticated */}
            {!isHomePage && (
              isAuthenticated ? (
                <Link
                  href="/learn"
                  className="text-sm font-semibold px-5 py-2 rounded-full transition-all hidden sm:block border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-800"
                >
                  {t('nav.learnFromOthers')}
                </Link>
              ) : (
                <Link
                  href="/learn"
                  className="text-sm font-medium px-3 py-2 rounded-full transition-all hidden sm:block hover:bg-gray-100 text-gray-700"
                >
                  {t('nav.learnFromOthers')}
                </Link>
              )
            )}

            {/* "Browse Missions" button - visible to all */}
            <Link
              href="/missions"
              className="text-sm font-semibold px-6 py-2.5 rounded-full transition-all hidden sm:block shadow-lg hover:-translate-y-0.5 bg-eco-primary text-white hover:bg-eco-primaryDark shadow-eco-primary/20 border border-transparent"
            >
              {t('home.hero.browseMissions')}
            </Link>

            {isAuthenticated ? (
              <>
                <NotificationBell />
                {/* Hide profile menu on mobile - use hamburger menu instead */}
                <div className="hidden sm:block">
                  <Menu shadow="md" width={220} position="bottom-end">
                    <Menu.Target>
                      <Avatar
                        src={user?.profilePictureUrl || user?.profilePicture || null}
                        radius="xl"
                        size={40}
                        style={{ cursor: 'pointer', border: '2px solid transparent' }}
                        className="hover:ring-2 hover:ring-eco-primary/50 transition-all"
                      >
                        <IconUser size={20} />
                      </Avatar>
                    </Menu.Target>

                    <Menu.Dropdown>
                      <Menu.Item component={Link} href="/favorites" leftSection={<IconHeart size={16} />}>
                        {t('nav.userMenu.favorites')}
                      </Menu.Item>

                      <Menu.Item component={Link} href="/my-missions" leftSection={<IconFolder size={16} />}>
                        {t('nav.userMenu.myMissions')}
                      </Menu.Item>

                      <Menu.Item component={Link} href="/participations" leftSection={<IconCompass size={16} />}>
                        {t('nav.userMenu.participations')}
                      </Menu.Item>

                      <Menu.Item component={Link} href="/messages" leftSection={<IconMail size={16} />}>
                        {t('nav.userMenu.messages')}
                      </Menu.Item>

                      <Menu.Item component={Link} href="/profile" leftSection={<IconUser size={16} />}>
                        {t('nav.userMenu.profile')}
                      </Menu.Item>

                      <Menu.Item component={Link} href="/settings" leftSection={<IconSettings size={16} />}>
                        {t('nav.userMenu.settings')}
                      </Menu.Item>

                      <Menu.Divider />

                      <Menu.Item leftSection={<IconLogout size={16} />} color="red" onClick={handleLogout}>
                        {t('nav.logout')}
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold px-6 py-2.5 rounded-full transition-all hidden sm:block shadow-lg hover:-translate-y-0.5 text-white border border-transparent"
                  style={{ backgroundColor: '#677DA3' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4d6080')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#677DA3')}
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
        </Group>
      </div>

      {/* Mobile Drawer */}
      <Drawer opened={opened} onClose={close} title="" withCloseButton={false} padding="md" size="md">
        <Stack gap="md">
          <Group justify="space-between" mb="lg">
            <Link href="/" onClick={close}>
              <img src="/images/logo-white.png" alt="Ecobilda" className="h-10 w-auto object-contain" />
            </Link>
            <Burger opened={opened} onClick={toggle} size="sm" />
          </Group>

          <Button
            component={Link}
            href="/missions"
            variant="filled"
            color="eco-primary"
            size="lg"
            radius="xl"
            fullWidth
            onClick={close}
            className="bg-eco-primary hover:bg-eco-primaryDark"
          >
            {t('home.hero.browseMissions')}
          </Button>

          {isAuthenticated ? (
            <>
              <Stack gap="xs">
                <Anchor component={Link} href="/favorites" onClick={close} className="py-2" c="black">
                  <Group gap="xs">
                    <IconHeart size={20} color="black" />
                    {t('nav.userMenu.favorites')}
                  </Group>
                </Anchor>
                <Anchor component={Link} href="/my-missions" onClick={close} className="py-2" c="black">
                  <Group gap="xs">
                    <IconFolder size={20} color="black" />
                    {t('nav.userMenu.myMissions')}
                  </Group>
                </Anchor>
                <Anchor component={Link} href="/participations" onClick={close} className="py-2" c="black">
                  <Group gap="xs">
                    <IconCompass size={20} color="black" />
                    {t('nav.userMenu.participations')}
                  </Group>
                </Anchor>
                <Anchor component={Link} href="/messages" onClick={close} className="py-2" c="black">
                  <Group gap="xs">
                    <IconMail size={20} color="black" />
                    {t('nav.userMenu.messages')}
                  </Group>
                </Anchor>
                <Anchor component={Link} href="/profile" onClick={close} className="py-2" c="black">
                  <Group gap="xs">
                    <IconUser size={20} color="black" />
                    {t('nav.userMenu.profile')}
                  </Group>
                </Anchor>
                <Anchor component={Link} href="/settings" onClick={close} className="py-2" c="black">
                  <Group gap="xs">
                    <IconSettings size={20} color="black" />
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
                href="/login"
                variant="filled"
                color="eco-blue"
                size="lg"
                radius="xl"
                fullWidth
                onClick={close}
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
