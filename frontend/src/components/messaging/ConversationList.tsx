'use client';

import { useState } from 'react';
import {
  Box,
  TextInput,
  Tabs,
  ScrollArea,
  Stack,
  Text,
  Group,
  Avatar,
  Badge,
  Center,
  ActionIcon,
  Popover,
  Switch,
  Divider,
} from '@mantine/core';
import {
  IconSearch,
  IconMessage,
  IconVolumeOff,
  IconSettings,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Conversation } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { profileService } from '@/services/profile';

dayjs.extend(relativeTime);

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  currentUserId?: string;
  onSelect: (conversationId: string) => void;
  onToggleMute?: (_conversationId: string) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  currentUserId,
  onSelect,
  onToggleMute: _onToggleMute,
}: ConversationListProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [emailNotif, setEmailNotif] = useState<boolean>((user as any)?.emailNotifications ?? true);
  const [inAppNotif, setInAppNotif] = useState<boolean>((user as any)?.inAppNotifications ?? true);

  const handleToggleEmail = async (value: boolean) => {
    setEmailNotif(value);
    try {
      await profileService.updateSettings({ emailNotifications: value });
    } catch {
      setEmailNotif(!value); // revert on error
    }
  };

  const handleToggleInApp = async (value: boolean) => {
    setInAppNotif(value);
    try {
      await profileService.updateSettings({ inAppNotifications: value });
    } catch {
      setInAppNotif(!value);
    }
  };

  // Filter conversations based on search and tab
  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.otherUser;
    const matchesSearch =
      searchQuery === '' ||
      `${otherUser?.firstName ?? ''} ${otherUser?.lastName ?? ''}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const unreadCount = conv.unreadCount ?? 0;
    const matchesTab =
      activeTab === 'all' || (activeTab === 'unread' && unreadCount > 0);
    return matchesSearch && matchesTab;
  });

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount ?? 0), 0);

  const isMuted = (conv: Conversation) => conv.isMuted ?? false;

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'white' }}>
      {/* Header with Search */}
      <Box p="lg" style={{ borderBottom: '1px solid #e0e0e0' }}>
        <Group justify="space-between" mb="md">
          <Text fw={700} size="xl">
            {t('messaging.title')}
          </Text>

          <Popover
            opened={settingsOpen}
            onChange={setSettingsOpen}
            position="bottom-end"
            shadow="md"
            width={260}
            withArrow
          >
            <Popover.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => setSettingsOpen((o) => !o)}
                aria-label={t('messaging.settingsTitle')}
              >
                <IconSettings size={18} />
              </ActionIcon>
            </Popover.Target>

            <Popover.Dropdown>
              <Text fw={600} size="sm" mb="sm">
                {t('messaging.settingsTitle')}
              </Text>
              <Divider mb="sm" />
              <Stack gap="sm">
                <Switch
                  label={t('settings.emailNotifications')}
                  description={t('settings.emailNotificationsDesc')}
                  checked={emailNotif}
                  onChange={(e) => handleToggleEmail(e.currentTarget.checked)}
                  color="eco-primary"
                  styles={{ track: { cursor: 'pointer' }, label: { cursor: 'pointer' } }}
                />
                <Switch
                  label={t('settings.inAppNotifications')}
                  description={t('settings.inAppNotificationsDesc')}
                  checked={inAppNotif}
                  onChange={(e) => handleToggleInApp(e.currentTarget.checked)}
                  color="eco-primary"
                  styles={{ track: { cursor: 'pointer' }, label: { cursor: 'pointer' } }}
                />
              </Stack>
            </Popover.Dropdown>
          </Popover>
        </Group>

        <TextInput
          placeholder={t('messaging.searchConversations')}
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          radius="xl"
        />
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List style={{ borderBottom: '1px solid #e0e0e0', paddingLeft: '16px' }}>
          <Tabs.Tab value="all">
            {t('messaging.all')}
          </Tabs.Tab>
          <Tabs.Tab
            value="unread"
            rightSection={
              totalUnread > 0 ? (
                <Badge size="xs" circle color="blue">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </Badge>
              ) : null
            }
          >
            {t('messaging.unread')}
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {/* Conversation List */}
      <ScrollArea style={{ flex: 1 }}>
        {filteredConversations.length > 0 ? (
          <Stack gap={0}>
            {filteredConversations.map((conv) => {
              const otherUser = conv.otherUser;
              const unreadCount = conv.unreadCount ?? 0;
              const isSelected = selectedId === conv._id;
              const muted = isMuted(conv);

              return (
                <Box
                  key={conv._id}
                  onClick={() => onSelect(conv._id)}
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#f7f7f7' : 'white',
                    borderLeft: isSelected ? '3px solid var(--mantine-color-blue-6)' : 'none',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <Group wrap="nowrap" align="flex-start" gap="sm">
                    <Avatar
                      src={otherUser?.profilePictureUrl || otherUser?.profilePicture}
                      size={48}
                      radius="xl"
                      color="blue"
                    >
                      {!otherUser?.profilePicture &&
                        `${otherUser?.firstName?.[0] ?? ''}${otherUser?.lastName?.[0] ?? ''}`}
                    </Avatar>

                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Group justify="space-between" gap="xs" mb={4} wrap="nowrap">
                        <Text fw={unreadCount > 0 ? 700 : 500} size="sm" lineClamp={1}>
                          {otherUser?.firstName}
                        </Text>
                        <Group gap={4} wrap="nowrap">
                          {muted && (
                            <IconVolumeOff size={14} color="var(--mantine-color-gray-6)" />
                          )}
                          <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                            {conv.lastMessageAt ? dayjs(conv.lastMessageAt).fromNow() : ''}
                          </Text>
                        </Group>
                      </Group>

                      <Group justify="space-between" align="center" wrap="nowrap">
                        <Text
                          size="xs"
                          c={unreadCount > 0 ? 'dark' : 'dimmed'}
                          fw={unreadCount > 0 ? 600 : 400}
                          lineClamp={1}
                          style={{ flex: 1 }}
                        >
                          {conv.lastMessageText || t('messaging.noMessagesDefault')}
                        </Text>

                        {unreadCount > 0 && (
                          <Badge size="sm" circle color="blue">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </Badge>
                        )}
                      </Group>
                    </Box>
                  </Group>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Center py={48}>
            <Stack align="center" gap="md">
              <IconMessage size={64} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" size="sm">
                {searchQuery
                  ? t('messaging.noConversationsFound')
                  : activeTab === 'unread'
                  ? t('messaging.noUnreadMessages')
                  : t('messaging.noConversations')}
              </Text>
            </Stack>
          </Center>
        )}
      </ScrollArea>
    </Box>
  );
}
