'use client';

import { useState } from 'react';
import { ActionIcon, Menu, Text, Stack, Button, ScrollArea, Group, Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconBell, IconCheck, IconMessage } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { isAuthenticated } from '@/lib/convexClient';
import { notificationsService } from '@/services/notifications';
import { useUnreadCount, useNotifications } from '@/hooks/useConvex';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function NotificationBell() {
  const t = useTranslations();
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const width = isMobile ? (typeof window !== 'undefined' ? window.innerWidth - 32 : 360) : 360;

  // Real-time reactive queries
  const unreadCount = useUnreadCount();
  const { notifications: allNotifications } = useNotifications();
  const notifications = allNotifications.slice(0, 10);

  const handleNotificationClick = async (notificationId: string, linkUrl: string, isRead: boolean) => {
    if (!isRead) {
      try {
        await notificationsService.markAsRead(notificationId);
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
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <ActionIcon variant="subtle" size="xl" radius="xl" aria-label={t('notifications.title')}>
            <IconBell size={24} />
          </ActionIcon>
          {unreadCount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: 'var(--mantine-color-eco-blue-6)',
                color: 'white',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                lineHeight: 1,
                boxShadow: '0 0 0 2px white',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
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
              {notifications.map((notification: any) => (
                <Menu.Item
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification._id, notification.linkUrl ?? '', notification.isRead)}
                  style={{
                    whiteSpace: 'normal',
                    height: 'auto',
                    padding: '12px',
                    backgroundColor: notification.isRead ? 'transparent' : 'var(--mantine-color-eco-primary-0)',
                  }}
                >
                  <Group gap="sm" wrap="nowrap" align="flex-start">
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
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={notification.isRead ? 400 : 600} lineClamp={1}>
                        {notification.title}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {notification.message}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {dayjs(notification._creationTime).fromNow()}
                      </Text>
                    </Stack>
                    {!notification.isRead && (
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
