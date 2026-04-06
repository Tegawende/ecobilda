'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  Container, Title, Text, Paper, Stack, Group, Button,
  ThemeIcon, Center, Loader,
} from '@mantine/core';
import { IconBell, IconCheck, IconMessage, IconFolder } from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { notificationsService } from '@/services/notifications';
import { useNotifications, useUnreadCount } from '@/hooks/useConvex';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function NotificationsClient() {
  const t = useTranslations();
  const router = useRouter();
  const { notifications, isLoading } = useNotifications();
  const unreadCount = useUnreadCount();

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
    } catch {
      // silent
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
    } catch {
      // silent
    }
  };

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
                  <Stack align="center" gap="sm">
                    <Loader size="lg" color="eco-primary" />
                    <Text size="sm" c="dimmed">{t('notifications.loading')}</Text>
                  </Stack>
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
                    {t('notifications.recentActivity')}
                  </Title>
                </Group>
                <Stack gap="sm">
                  {notifications.map((notification: any) => (
                    <Paper
                      key={notification._id}
                      radius="lg"
                      p="md"
                      withBorder
                      style={{
                        backgroundColor: notification.isRead ? undefined : 'var(--mantine-color-eco-primary-0)',
                        borderColor: notification.isRead ? undefined : 'var(--mantine-color-eco-primary-2)',
                        cursor: notification.linkUrl ? 'pointer' : undefined,
                      }}
                      onClick={() => {
                        if (!notification.isRead) handleMarkRead(notification._id);
                        if (notification.linkUrl) router.push(notification.linkUrl);
                      }}
                    >
                      <Group wrap="nowrap">
                        <ThemeIcon
                          size="lg"
                          radius="xl"
                          color={notification.isRead ? 'gray' : 'eco-primary'}
                          variant="light"
                          style={{ flexShrink: 0 }}
                        >
                          <IconMessage size={18} />
                        </ThemeIcon>
                        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" fw={notification.isRead ? 400 : 600}>
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
                          <div
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
