'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  Container, Title, Text, Paper, Stack, Group, Button, Badge,
  ThemeIcon, Center, Loader,
} from '@mantine/core';
import { IconBell, IconCheck, IconMessage } from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { notificationsService } from '@/services/notifications';
import type { Notification } from '@/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function NotificationsPage() {
  const t = useTranslations();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationsService.getNotifications();
        setNotifications(data);
      } catch (err) {
        // silent
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // silent
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <Container size="sm">
          <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" mb="xl">
              <Group gap="md">
                <ThemeIcon size={48} radius="md" color="eco-primary" variant="light">
                  <IconBell size={28} />
                </ThemeIcon>
                <Stack gap={4}>
                  <Title order={1} className="font-display">
                    {t('notifications.title')}
                  </Title>
                  <Text c="dimmed">
                    {unreadCount > 0
                      ? t('notifications.unreadCount', { count: unreadCount })
                      : t('notifications.allRead')}
                  </Text>
                </Stack>
              </Group>

              {unreadCount > 0 && (
                <Button
                  variant="light"
                  color="eco-primary"
                  radius="xl"
                  leftSection={<IconCheck size={16} />}
                  onClick={handleMarkAllRead}
                >
                  {t('notifications.markAllRead')}
                </Button>
              )}
            </Group>

            {/* Notifications List */}
            {isLoading ? (
              <Paper radius="lg" p="xl" withBorder>
                <Center py="xl">
                  <Loader color="eco-primary" />
                </Center>
              </Paper>
            ) : notifications.length === 0 ? (
              <Paper radius="lg" p="xl" withBorder>
                <Center py="xl">
                  <Stack align="center" gap="sm">
                    <IconBell size={48} className="text-gray-300" />
                    <Text c="dimmed">{t('notifications.noNotifications')}</Text>
                  </Stack>
                </Center>
              </Paper>
            ) : (
              <Paper radius="lg" p="lg" withBorder>
                <Group gap="sm" mb="lg" pb="md" className="border-b border-gray-100">
                  <IconMessage size={24} className="text-eco-primary" />
                  <Title order={4} className="font-display">
                    {t('notifications.recentActivity') || 'Recent Activity'}
                  </Title>
                </Group>
                <Stack gap="sm">
                  {notifications.map((notification) => (
                    <Paper
                      key={notification._id}
                      radius="lg"
                      p="md"
                      withBorder
                      style={{
                        backgroundColor: notification.isRead ? undefined : 'var(--mantine-color-eco-primary-0)',
                        borderColor: notification.isRead ? undefined : 'var(--mantine-color-eco-primary-2)',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        if (!notification.isRead) handleMarkRead(notification._id);
                        if ((notification as any).link) router.push((notification as any).link);
                      }}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
                          <ThemeIcon
                            size="lg"
                            radius="xl"
                            color={notification.isRead ? 'gray' : 'eco-primary'}
                            variant="light"
                          >
                            <IconMessage size={18} />
                          </ThemeIcon>
                          <Stack gap={2} style={{ flex: 1 }}>
                            <Text size="sm" fw={notification.isRead ? 400 : 600}>
                              {notification.message}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {dayjs(notification._creationTime).fromNow()}
                            </Text>
                          </Stack>
                        </Group>
                        {!notification.isRead && (
                          <Badge size="xs" color="eco-primary" variant="filled" circle>
                            {' '}
                          </Badge>
                        )}
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Container>
      </div>
    </Layout>
  );
}
