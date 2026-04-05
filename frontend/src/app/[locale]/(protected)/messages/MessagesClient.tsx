'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  IconMail,
  IconArrowLeft,
  IconSend,
  IconDotsVertical,
  IconBellOff,
  IconBell,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Center,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { Layout } from '@/components/common/Layout';
import type { Conversation, Message } from '@/types';

// Conversation List Item
function ConversationItem({
  conversation,
  currentUserId,
  isSelected,
  onClick,
}: {
  conversation: Conversation;
  currentUserId: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const otherUser = conversation.otherUser;
  const unreadCount = conversation.unreadCount ?? 0;

  return (
    <UnstyledButton
      onClick={onClick}
      className={`w-full border-b border-gray-100 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-eco-brand-50' : ''}`}
      p="md"
    >
      <Group gap="sm" wrap="nowrap">
        <img
          src={otherUser?.profilePictureUrl || undefined}
          alt={`${otherUser?.firstName} ${otherUser?.lastName}`}
          className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0"
        />
        <Box className="flex-1 min-w-0">
          <Group justify="space-between" wrap="nowrap">
            <Text fw={600} truncate className={unreadCount > 0 ? 'text-eco-primary' : ''}>
              {otherUser?.firstName} {otherUser?.lastName}
            </Text>
            {unreadCount > 0 && (
              <Center className="w-5 h-5 bg-eco-primary text-white text-xs font-bold rounded-full flex-shrink-0">
                {unreadCount}
              </Center>
            )}
          </Group>
          <Text size="sm" c="dimmed" truncate mt={2}>{conversation.lastMessageText}</Text>
          <Text size="xs" c="dimmed" mt={4}>
            {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            }) : ''}
          </Text>
        </Box>
      </Group>
    </UnstyledButton>
  );
}

// Message Bubble
function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isOwn && (
        <img
          src={message.sender?.profilePictureUrl || undefined}
          alt=""
          className="w-8 h-8 rounded-full object-cover mr-2 mt-1 flex-shrink-0"
        />
      )}
      <Box
        className={`max-w-[70%] rounded-2xl ${isOwn
            ? 'bg-eco-primary text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}
        px="md"
        py="sm"
      >
        <Text size="sm" lh={1.6}>{message.body}</Text>
        <Text size="xs" mt={4} className={isOwn ? 'text-white/70' : 'text-gray-500'}>
          {message._creationTime ? new Date(message._creationTime).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          }) : ''}
        </Text>
      </Box>
    </div>
  );
}

// Conversation Options Menu
function ConversationOptionsMenu({
  isOpen,
  onClose,
  onMute,
  onDelete,
  onViewProfile,
  isMuted,
  profileLink,
}: {
  isOpen: boolean;
  onClose: () => void;
  onMute: () => void;
  onDelete: () => void;
  onViewProfile: () => void;
  isMuted: boolean;
  profileLink: string;
}) {
  const t = useTranslations();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Menu */}
      <Box className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
        <UnstyledButton
          component={Link}
          href={profileLink}
          className="w-full hover:bg-gray-50 transition-colors"
          px="md"
          py="sm"
          onClick={() => {
            onViewProfile();
            onClose();
          }}
        >
          <Group gap="sm">
            <IconUser size={18} className="text-gray-700" />
            <Text size="sm" fw={500} c="dark">{t('messaging.viewProfile')}</Text>
          </Group>
        </UnstyledButton>
        <UnstyledButton
          onClick={() => {
            onMute();
            onClose();
          }}
          className="w-full hover:bg-gray-50 transition-colors"
          px="md"
          py="sm"
        >
          <Group gap="sm">
            {isMuted ? <IconBell size={18} className="text-gray-700" /> : <IconBellOff size={18} className="text-gray-700" />}
            <Text size="sm" fw={500} c="dark">{isMuted ? t('messaging.unmute') : t('messaging.mute')}</Text>
          </Group>
        </UnstyledButton>
        <UnstyledButton
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full hover:bg-red-50 transition-colors"
          px="md"
          py="sm"
        >
          <Group gap="sm">
            <IconTrash size={18} className="text-red-600" />
            <Text size="sm" fw={500} c="red">{t('messaging.delete')}</Text>
          </Group>
        </UnstyledButton>
      </Box>
    </>
  );
}

// Chat View
function ChatView({
  conversationId,
  onBack,
  messages: initialMessages,
  onSendMessage,
  conversations,
  currentUser,
}: {
  conversationId: string;
  onBack: () => void;
  messages: Message[];
  onSendMessage: (conversationId: string, text: string) => void;
  conversations: Conversation[];
  currentUser: any;
}) {
  const t = useTranslations();
  const [message, setMessage] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const conversation = conversations.find((c) => c._id === conversationId);

  const otherUser = conversation
    ? conversation.otherUser
    : null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(conversationId, message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!conversation || !otherUser) {
    return (
      <Center className="flex-1 bg-gray-50">
        <Text c="dimmed">{t('messaging.conversationNotFoundShort')}</Text>
      </Center>
    );
  }

  return (
    <Stack gap={0} h="100%" bg="white">
      {/* Header */}
      <Group gap="sm" p="md" className="border-b border-gray-200 relative" wrap="nowrap">
        <ActionIcon
          variant="subtle"
          color="gray"
          radius="xl"
          onClick={onBack}
          className="lg:hidden"
        >
          <IconArrowLeft size={20} />
        </ActionIcon>
        <Link href={`/profile/${otherUser._id}`}>
          <img
            src={otherUser?.profilePictureUrl || undefined}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-gray-200 hover:opacity-80 transition-opacity"
          />
        </Link>
        <Box className="flex-1">
          <Text
            component={Link}
            href={`/profile/${otherUser._id}`}
            fw={600}
            className="hover:text-eco-primary transition-colors"
          >
            {otherUser?.firstName} {otherUser?.lastName}
          </Text>
          <Text size="xs" c="dimmed">
            {(otherUser as any)?.address?.city}{(otherUser as any)?.address?.country?.name ? `, ${(otherUser as any).address.country.name}` : ''}
          </Text>
        </Box>
        <Box pos="relative">
          <ActionIcon
            variant="subtle"
            color="gray"
            radius="xl"
            onClick={() => setShowOptions(!showOptions)}
          >
            <IconDotsVertical size={20} />
          </ActionIcon>
          <ConversationOptionsMenu
            isOpen={showOptions}
            onClose={() => setShowOptions(false)}
            onMute={() => setIsMuted(!isMuted)}
            onDelete={() => console.log('Delete conversation')}
            onViewProfile={() => { }}
            isMuted={isMuted}
            profileLink={`/profile/${otherUser._id}`}
          />
        </Box>
      </Group>

      {/* Messages */}
      <Box className="flex-1 overflow-y-auto" p="md" bg="gray.0">
        {initialMessages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={msg.senderId === currentUser?._id}
          />
        ))}
      </Box>

      {/* Input */}
      <form onSubmit={handleSend}>
        <Group gap="sm" p="md" className="border-t border-gray-200" wrap="nowrap">
          <TextInput
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('messaging.placeholder')}
            radius="xl"
            size="md"
            className="flex-1"
            styles={{ input: { border: '1px solid var(--mantine-color-gray-3)' } }}
          />
          <ActionIcon
            type="submit"
            disabled={!message.trim()}
            size={48}
            radius="xl"
            className="bg-eco-primary text-white hover:bg-eco-primaryDark disabled:opacity-50 transition-all"
          >
            <IconSend size={20} />
          </ActionIcon>
        </Group>
      </form>
    </Stack>
  );
}

export function MessagesClient() {
  const t = useTranslations();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    import('@/services/messaging').then(({ messagingService }) => {
      messagingService.getConversations().then(setConversations).catch(() => {});
    });
    import('@/services/profile').then(({ profileService }) => {
      profileService.getProfile().then(setCurrentUser).catch(() => {});
    });
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedConversationId = id || null;

  // Filter messages for current conversation
  const currentMessages = selectedConversationId
    ? allMessages.filter((m) => m.conversationId === selectedConversationId)
    : [];

  // Handle sending a message
  const handleSendMessage = (conversationId: string, text: string) => {
    const newMessage: Message = {
      _id: `temp-${Date.now()}`,
      conversationId: conversationId,
      sender: currentUser ? { _id: currentUser._id, firstName: currentUser.firstName, lastName: currentUser.lastName } : null,
      body: text,
      _creationTime: Date.now(),
    };
    setAllMessages((prev) => [...prev, newMessage]);
  };

  // Mobile: Show either list or chat
  if (isMobile) {
    if (selectedConversationId) {
      return (
        <Layout hideFooter>
          <Box h="calc(100vh - 60px)">
            <ChatView
              conversationId={selectedConversationId}
              onBack={() => router.push('/messages')}
              messages={currentMessages}
              onSendMessage={handleSendMessage}
              conversations={conversations}
              currentUser={currentUser}
            />
          </Box>
        </Layout>
      );
    }

    return (
      <Layout hideFooter>
        <Box h="calc(100vh - 60px)" bg="white">
          <Box p="md" className="border-b border-gray-200">
            <Title order={2} className="font-display">
              {t('messaging.title')}
            </Title>
          </Box>
          <Box className="overflow-y-auto">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                currentUserId={currentUser?._id}
                isSelected={false}
                onClick={() => router.push(`/messages/${conv._id}`)}
              />
            ))}
          </Box>
        </Box>
      </Layout>
    );
  }

  // Desktop: Two-column layout
  return (
    <Layout hideFooter>
      <Group gap={0} h="calc(100vh - 60px)" wrap="nowrap" align="stretch">
        {/* Conversation List */}
        <Stack gap={0} w={320} className="flex-shrink-0 border-r border-gray-200" bg="white">
          <Box p="md" className="border-b border-gray-200">
            <Title order={2} className="font-display">
              {t('messaging.title')}
            </Title>
          </Box>
          <Box className="overflow-y-auto flex-1">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv._id}
                  conversation={conv}
                  currentUserId={currentUser?._id}
                  isSelected={conv._id === selectedConversationId}
                  onClick={() => router.push(`/messages/${conv._id}`)}
                />
              ))
            ) : (
              <Stack align="center" justify="center" p="xl" gap="md">
                <IconMail size={48} className="text-gray-300" />
                <Text c="dimmed">{t('messaging.noConversations')}</Text>
              </Stack>
            )}
          </Box>
        </Stack>

        {/* Chat Area */}
        <Box className="flex-1 flex flex-col">
          {selectedConversationId ? (
            <ChatView
              conversationId={selectedConversationId}
              onBack={() => router.push('/messages')}
              messages={currentMessages}
              onSendMessage={handleSendMessage}
              conversations={conversations}
              currentUser={currentUser}
            />
          ) : (
            <Center className="flex-1" bg="gray.0">
              <Stack align="center" gap="md">
                <IconMail size={64} className="text-gray-300" />
                <Text size="lg" fw={600} c="dark.3">
                  {t('messaging.selectConversation')}
                </Text>
                <Text c="dimmed">
                  {t('messaging.selectConversationDesc')}
                </Text>
              </Stack>
            </Center>
          )}
        </Box>
      </Group>
    </Layout>
  );
}
