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
  currentUserId: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const otherUser = conversation.user1.id === currentUserId ? conversation.user2 : conversation.user1;
  const unreadCount = conversation.user1.id === currentUserId ? conversation.unread_count_user1 : conversation.unread_count_user2;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer ${isSelected ? 'bg-eco-brand-50' : ''}`}
    >
      <img
        src={otherUser.profile_picture || undefined}
        alt={`${otherUser.first_name} ${otherUser.last_name}`}
        className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`font-semibold text-gray-900 truncate ${unreadCount > 0 ? 'text-eco-primary' : ''}`}>
            {otherUser.first_name} {otherUser.last_name}
          </p>
          {unreadCount > 0 && (
            <span className="w-5 h-5 bg-eco-primary text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate mt-0.5">{conversation.last_message_text}</p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(conversation.last_message_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          })}
        </p>
      </div>
    </button>
  );
}

// Message Bubble
function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isOwn && (
        <img
          src={message.sender.profile_picture || undefined}
          alt=""
          className="w-8 h-8 rounded-full object-cover mr-2 mt-1 flex-shrink-0"
        />
      )}
      <div
        className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${isOwn
            ? 'bg-eco-primary text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}
      >
        <p className="text-sm leading-relaxed">{message.body}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
          {new Date(message.created_at).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
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
      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
        <Link href={profileLink}
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => {
            onViewProfile();
            onClose();
          }}
        >
          <IconUser size={18} />
          <span className="text-sm font-medium">{t('messaging.viewProfile')}</span>
        </Link>
        <button
          onClick={() => {
            onMute();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          {isMuted ? <IconBell size={18} /> : <IconBellOff size={18} />}
          <span className="text-sm font-medium">{isMuted ? t('messaging.unmute') : t('messaging.mute')}</span>
        </button>
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <IconTrash size={18} />
          <span className="text-sm font-medium">{t('messaging.delete')}</span>
        </button>
      </div>
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
  conversationId: number;
  onBack: () => void;
  messages: Message[];
  onSendMessage: (conversationId: number, text: string) => void;
  conversations: Conversation[];
  currentUser: any;
}) {
  const t = useTranslations();
  const [message, setMessage] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const conversation = conversations.find((c) => c.id === conversationId);

  const otherUser = conversation
    ? conversation.user1.id === currentUser?.id
      ? conversation.user2
      : conversation.user1
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
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500">
        Conversation not found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white relative">
        <button
          onClick={onBack}
          className="lg:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <IconArrowLeft size={20} />
        </button>
        <Link href={`/profile/${otherUser.id}`} className="cursor-pointer">
          <img
            src={otherUser.profile_picture || undefined}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-gray-200 hover:opacity-80 transition-opacity"
          />
        </Link>
        <div className="flex-1">
          <Link href={`/profile/${otherUser.id}`}
            className="font-semibold text-gray-900 hover:text-eco-primary transition-colors cursor-pointer"
          >
            {otherUser.first_name} {otherUser.last_name}
          </Link>
          <p className="text-xs text-gray-500">
            {otherUser.address?.city}, {otherUser.address?.country?.name}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <IconDotsVertical size={20} className="text-gray-500" />
          </button>
          <ConversationOptionsMenu
            isOpen={showOptions}
            onClose={() => setShowOptions(false)}
            onMute={() => setIsMuted(!isMuted)}
            onDelete={() => console.log('Delete conversation')}
            onViewProfile={() => { }}
            isMuted={isMuted}
            profileLink={`/profile/${otherUser.id}`}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {initialMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender.id === currentUser?.id}
          />
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('messaging.placeholder')}
            className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="w-12 h-12 rounded-full bg-eco-primary text-white flex items-center justify-center hover:bg-eco-primaryDark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            <IconSend size={20} />
          </button>
        </div>
      </form>
    </div>
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

  const selectedConversationId = id ? parseInt(id) : null;

  // Filter messages for current conversation
  const currentMessages = selectedConversationId
    ? allMessages.filter((m) => m.conversation === selectedConversationId)
    : [];

  // Handle sending a message
  const handleSendMessage = (conversationId: number, text: string) => {
    const newMessage: Message = {
      id: Date.now(),
      conversation: conversationId,
      sender: currentUser,
      body: text,
      created_at: new Date().toISOString(),
    };
    setAllMessages((prev) => [...prev, newMessage]);
  };

  // Mobile: Show either list or chat
  if (isMobile) {
    if (selectedConversationId) {
      return (
        <Layout hideFooter>
          <div className="h-[calc(100vh-60px)]">
            <ChatView
              conversationId={selectedConversationId}
              onBack={() => router.push('/messages')}
              messages={currentMessages}
              onSendMessage={handleSendMessage}
              conversations={conversations}
              currentUser={currentUser}
            />
          </div>
        </Layout>
      );
    }

    return (
      <Layout hideFooter>
        <div className="h-[calc(100vh-60px)] bg-white">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-display font-bold text-gray-900">
              {t('messaging.title')}
            </h1>
          </div>
          <div className="overflow-y-auto">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                currentUserId={currentUser?.id}
                isSelected={false}
                onClick={() => router.push(`/messages/${conv.id}`)}
              />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Desktop: Two-column layout
  return (
    <Layout hideFooter>
      <div className="flex h-[calc(100vh-60px)]">
        {/* Conversation List */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-display font-bold text-gray-900">
              {t('messaging.title')}
            </h1>
          </div>
          <div className="overflow-y-auto flex-1">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  currentUserId={currentUser?.id}
                  isSelected={conv.id === selectedConversationId}
                  onClick={() => router.push(`/messages/${conv.id}`)}
                />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <IconMail size={48} className="mx-auto mb-4 opacity-50" />
                <p>{t('messaging.noConversations')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
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
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <IconMail size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-semibold text-gray-700">
                  {t('messaging.selectConversation')}
                </p>
                <p className="text-gray-500 mt-1">
                  {t('messaging.selectConversationDesc')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
