import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Check, ExternalLink, Loader2, AlertCircle, Search, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminApi, type ContactMessage } from '@/services/api';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/hooks/useToast';

export function ContactsPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'new' | 'all'>('new');

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getContactMessages();
      setMessages(data);
    } catch (err) {
      setError(t('contacts.failedToLoad'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleMarkAsRead = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.markContactAsRead(id);
      setMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status: 'read' } : m))
      );
      toast({ title: t('contacts.markedAsRead') });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsResolved = async (id: string) => {
    setActionLoading(id + '-resolve');
    try {
      await adminApi.markContactAsResolved(id);
      setMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status: 'resolved' } : m))
      );
      toast({ title: t('contacts.markedAsResolved') });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const newMessages = messages.filter((m) => (m.status ?? 'new') === 'new');
  const allFiltered = messages.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  });

  const statusBadge = (status: string) => {
    const s = status ?? 'new';
    if (s === 'new') return <Badge variant="default" className="bg-blue-500">{t('contacts.statusNew')}</Badge>;
    if (s === 'read') return <Badge variant="secondary">{t('contacts.statusRead')}</Badge>;
    return <Badge variant="outline" className="text-green-600 border-green-600">{t('contacts.statusResolved')}</Badge>;
  };

  const MessageCard = ({ msg }: { msg: ContactMessage }) => {
    const isExpanded = expandedId === msg._id;
    return (
      <Card key={msg._id} className={msg.status === 'new' || !msg.status ? 'border-blue-200 bg-blue-50/30' : ''}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-sm">{msg.name}</span>
                {statusBadge(msg.status ?? 'new')}
                <span className="text-xs text-muted-foreground">{formatDateTime(msg._creationTime)}</span>
              </div>
              <div className="flex items-center gap-1 mb-2">
                <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                <a
                  href={`mailto:${msg.email}`}
                  className="text-xs text-blue-600 hover:underline truncate"
                >
                  {msg.email}
                </a>
                <ExternalLink className="w-3 h-3 text-muted-foreground ml-1 shrink-0" />
              </div>
              <p className="text-sm font-medium mb-1">{msg.subject}</p>
              <p
                className={`text-sm text-muted-foreground leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}
              >
                {msg.message}
              </p>
              {msg.message.length > 120 && (
                <button
                  className="text-xs text-blue-600 hover:underline mt-1"
                  onClick={() => setExpandedId(isExpanded ? null : msg._id)}
                >
                  {isExpanded ? t('contacts.showLess') : t('contacts.showMore')}
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {(msg.status === 'new' || !msg.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAsRead(msg._id)}
                  disabled={actionLoading === msg._id}
                >
                  {actionLoading === msg._id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  <span className="ml-1">{t('contacts.markRead')}</span>
                </Button>
              )}
              {msg.status !== 'resolved' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-700 border-green-300 hover:bg-green-50"
                  onClick={() => handleMarkAsResolved(msg._id)}
                  disabled={actionLoading === msg._id + '-resolve'}
                >
                  {actionLoading === msg._id + '-resolve' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  <span className="ml-1">{t('contacts.markResolved')}</span>
                </Button>
              )}
              <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}>
                <Button size="sm" className="w-full bg-eco-primary hover:bg-eco-primaryDark text-white">
                  <Mail className="w-3 h-3 mr-1" />
                  {t('contacts.reply')}
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('contacts.title')}</h1>
        <p className="text-muted-foreground">{t('contacts.subtitle')}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-md">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'new' | 'all')}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="new">
              {t('contacts.tabNew')}
              {newMessages.length > 0 && (
                <Badge className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0">{newMessages.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">{t('contacts.tabAll')}</TabsTrigger>
          </TabsList>
          {activeTab === 'all' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('contacts.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          )}
        </div>

        <TabsContent value="new" className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : newMessages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t('contacts.noNewMessages')}</p>
              </CardContent>
            </Card>
          ) : (
            newMessages.map((msg) => <MessageCard key={msg._id} msg={msg} />)
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : allFiltered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery ? t('contacts.noMatchingMessages') : t('contacts.noMessages')}
                </p>
              </CardContent>
            </Card>
          ) : (
            allFiltered.map((msg) => <MessageCard key={msg._id} msg={msg} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
