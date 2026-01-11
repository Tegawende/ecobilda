import { useState, useEffect } from 'react';
import { Badge, ActionIcon, Menu, Text, Stack, Button, ScrollArea, Group, Box, Indicator } from '@mantine/core';
import { IconBell, IconCheck, IconMessage } from '@tabler/icons-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { isAuthenticated } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function NotificationBell() {
  const navigate = useNavigate();
  const { unreadCount, notifications, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [opened, setOpened] = useState(false);

  // Refresh notifications when menu opens
  useEffect(() => {
    if (opened && isAuthenticated()) {
      refreshNotifications();
    }
  }, [opened]);

  const handleNotificationClick = async (notificationId: number, linkUrl: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }

    navigate(linkUrl);
    setOpened(false);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  if (!isAuthenticated()) return null;

  return (
    <Menu
      shadow="md"
      width={360}
      position="bottom-end"
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
          <ActionIcon variant="subtle" size="lg" radius="xl" aria-label="Notifications">
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Group justify="space-between">
            <Text fw={600}>Notifications</Text>
            {unreadCount > 0 && (
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconCheck size={14} />}
                onClick={handleMarkAllRead}
              >
                Mark all read
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
                    backgroundColor: notification.is_read ? 'transparent' : 'var(--mantine-color-blue-0)',
                  }}
                >
                  <Group gap="sm" wrap="nowrap" align="flex-start">
                    <Box
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: 'var(--mantine-color-blue-1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconMessage size={20} color="var(--mantine-color-blue-6)" />
                    </Box>
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
                          backgroundColor: 'var(--mantine-color-blue-6)',
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
                No new notifications
              </Text>
            </Box>
          )}
        </ScrollArea.Autosize>

        {notifications.length > 0 && (
          <>
            <Menu.Divider />
            <Menu.Item onClick={() => { navigate('/messages'); setOpened(false); }}>
              <Text size="sm" fw={500} c="blue" ta="center">
                View all messages
              </Text>
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}


