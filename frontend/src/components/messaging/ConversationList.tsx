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
  ActionIcon,
  Center,
} from '@mantine/core';
import {
  IconSearch,
  IconMessage,
  IconVolume,
  IconVolumeOff,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Conversation } from '../../types';

dayjs.extend(relativeTime);

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: number;
  currentUserId?: number;
  onSelect: (conversationId: number) => void;
  onToggleMute?: (conversationId: number) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  currentUserId,
  onSelect,
  onToggleMute,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('all');

  // Filter conversations based on search and tab
  const filteredConversations = conversations.filter((conv) => {
    // Get the other user
    const otherUser =
      currentUserId === conv.user1.id ? conv.user2 : conv.user1;

    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      `${otherUser.first_name} ${otherUser.last_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    // Tab filter
    const unreadCount =
      currentUserId === conv.user1.id
        ? conv.unread_count_user1
        : conv.unread_count_user2;

    const matchesTab =
      activeTab === 'all' || (activeTab === 'unread' && unreadCount > 0);

    return matchesSearch && matchesTab;
  });

  // Calculate total unread count
  const totalUnread = conversations.reduce((sum, conv) => {
    const unreadCount =
      currentUserId === conv.user1.id
        ? conv.unread_count_user1
        : conv.unread_count_user2;
    return sum + unreadCount;
  }, 0);

  const getOtherUser = (conv: Conversation) => {
    return currentUserId === conv.user1.id ? conv.user2 : conv.user1;
  };

  const getUnreadCount = (conv: Conversation) => {
    return currentUserId === conv.user1.id
      ? conv.unread_count_user1
      : conv.unread_count_user2;
  };

  const isMuted = (conv: Conversation) => {
    return currentUserId === conv.user1.id
      ? conv.user1_muted
      : conv.user2_muted;
  };

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'white' }}>
      {/* Header with Search */}
      <Box p="lg" style={{ borderBottom: '1px solid #e0e0e0' }}>
        <Group justify="space-between" mb="md">
          <Text fw={700} size="xl">
            Messages
          </Text>
        </Group>

        <TextInput
          placeholder="Search conversations..."
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
            All
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
            Unread
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {/* Conversation List */}
      <ScrollArea style={{ flex: 1 }}>
        {filteredConversations.length > 0 ? (
          <Stack gap={0}>
            {filteredConversations.map((conv) => {
              const otherUser = getOtherUser(conv);
              const unreadCount = getUnreadCount(conv);
              const isSelected = selectedId === conv.id;
              const muted = isMuted(conv);

              return (
                <Box
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#f7f7f7' : 'white',
                    borderLeft: isSelected ? '3px solid var(--mantine-color-blue-6)' : 'none',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <Group wrap="nowrap" align="flex-start" gap="sm">
                    <Avatar
                      src={otherUser.profile_picture}
                      size={48}
                      radius="xl"
                      color="blue"
                    >
                      {!otherUser.profile_picture &&
                        `${otherUser.first_name[0]}${otherUser.last_name[0]}`}
                    </Avatar>

                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Group justify="space-between" gap="xs" mb={4} wrap="nowrap">
                        <Text
                          fw={unreadCount > 0 ? 700 : 500}
                          size="sm"
                          lineClamp={1}
                        >
                          {otherUser.first_name} {otherUser.last_name}
                        </Text>
                        <Group gap={4} wrap="nowrap">
                          {muted && (
                            <IconVolumeOff size={14} color="var(--mantine-color-gray-6)" />
                          )}
                          <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                            {conv.last_message_at
                              ? dayjs(conv.last_message_at).fromNow()
                              : ''}
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
                          {conv.last_message_text || 'No messages yet'}
                        </Text>

                        {unreadCount > 0 && (
                          <Badge size="sm" circle color="blue">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </Badge>
                        )}
                      </Group>

                      {otherUser.address && (
                        <Text size="xs" c="dimmed" mt={2}>
                          {otherUser.address.city}
                          {otherUser.address.country && `, ${otherUser.address.country.name}`}
                        </Text>
                      )}
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
                  ? 'No conversations found'
                  : activeTab === 'unread'
                  ? 'No unread messages'
                  : 'No conversations yet'}
              </Text>
            </Stack>
          </Center>
        )}
      </ScrollArea>
    </Box>
  );
}
