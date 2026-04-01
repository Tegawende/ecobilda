'use client';

import { useState, useEffect } from 'react';
import { ActionIcon, Menu, Text, Stack, Button, ScrollArea, Group, Box, Indicator } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconBell, IconCheck, IconMessage } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { isAuthenticated } from '@/services/api';
import { notificationsService } from '@/services/notifications';
import type { Notification } from '@/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function NotificationBell() {
  const t = useTranslations();
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const width = isMobile ? (typeof window !== 'undefined' ? window.innerWidth - 32 : 360) : 360;

  const refreshCount = async () => {
    if (!isAuthenticated()) return;
    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silently fail
    }
  };

  const refreshNotifications = async () => {
    if (!isAuthenticated()) return;
    try {
      const notifs = await notificationsService.getNotifications(true);
      setNotifications(notifs.slice(0, 10));
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    refreshCount();
    refreshNotifications();
    const interval = setInterval(refreshCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (opened && isAuthenticated()) {
      refreshNotifications();
    }
  }, [opened]);

  const handleNotificationClick = async (notificationId: number, linkUrl: string, isRead: boolean) => {
    if (!isRead) {
      try {
        await notificationsService.markAsRead(notificationId);
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {
        // silently fail
      }
    }
    router.push(linkUrl as any);
    setOpened(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  if (!isAuthenticated()) return null;

  return (
    <Menu
      shadow="md"
      width={width}
      position={isMobile ? 'bottom' : 'bottom-end'}
      offset={isMobile ? 0 : 4}
      opened={opened}
      onChange={setOpened}
      withinPortal
    >
      <Menu.Target>
        <Indicator
          label={unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined}
          size={16}
          color="red"
          disabled={unreadCount === 0}
          offset={4}
        >
          <ActionIcon variant="subtle" size="xl" radius="xl" aria-label={t('notifications.title')}>
            <IconBell size={24} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>

      <Menu.Dropdown style={isMobile ? { left: '16px', right: '16px', position: 'fixed' } : undefined}>
        <Menu.Label>
          <Group justify="space-between">
            <Text fw={600}>{t('notifications.title')}</Text>
            {unreadCount > 0 && (
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconCheck size={14} />}
                onClick={handleMarkAllRead}
              >
                {t('notifications.markAllRead')}
              </Button>
            )}
          </Group>
        </Menu.Label>

        <ScrollArea.Autosize mah={400} type="auto">
          {notifications.length > 0 ? (
            <Stack gap={0}>
              {notifications.map((notification) => (
                <Menu.Item
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, notification.link_url, notification.is_read)}
                  style={{
                    whiteSpace: 'normal',
                    height: 'auto',
                    padding: '12px',
                    backgroundColor: notification.is_read ? 'transparent' : 'var(--mantine-color-eco-primary-0)',
                  }}
                >
                  <Group gap="sm" wrap="nowrap" align="flex-start">
                    {notification.sender_profile_picture ? (
                      <Box
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={notification.sender_profile_picture}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                    ) : (
                      <Box
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: 'var(--mantine-color-eco-primary-1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconMessage size={20} color="var(--mantine-color-eco-primary-6)" />
                      </Box>
                    )}
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={notification.is_read ? 400 : 600} lineClamp={1}>
                        {notification.title}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {notification.message}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {dayjs(notification.created_at).fromNow()}
                      </Text>
                    </Stack>
                    {!notification.is_read && (
                      <Box
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: 'var(--mantine-color-eco-primary-6)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Group>
                </Menu.Item>
              ))}
            </Stack>
          ) : (
            <Box p="md" ta="center">
              <IconBell size={32} color="var(--mantine-color-gray-5)" />
              <Text size="sm" c="dimmed" mt="xs">
                {t('notifications.noNew')}
              </Text>
            </Box>
          )}
        </ScrollArea.Autosize>

        <Menu.Divider />
        <Menu.Item onClick={() => { router.push('/notifications'); setOpened(false); }}>
          <Text size="sm" fw={500} c="eco-primary" ta="center">
            {t('notifications.viewAll')}
          </Text>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
