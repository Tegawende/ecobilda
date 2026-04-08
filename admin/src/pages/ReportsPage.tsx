import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Loader2, Flag, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminApi, type Report } from '@/services/api';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { useAdminQuery } from '@/hooks/useAdminQuery';
import { api } from '@convex/_generated/api';

export function ReportsPage() {
  const { t } = useTranslation();
  const pendingReportsData = useAdminQuery(api.admin.reports.getPending as any);
  const allReportsData = useAdminQuery(api.admin.reports.list as any);
  const pendingReports = ((pendingReportsData as any)?.results || pendingReportsData || []) as Report[];
  const allReports = ((allReportsData as any)?.results || allReportsData || []) as Report[];
  const isLoadingPending = pendingReportsData === undefined;
  const isLoadingAll = allReportsData === undefined;
  const [filter, setFilter] = useState<'PENDING' | 'all'>('PENDING');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('all');

  const handleResolve = useCallback(async (id: string, action: 'resolve' | 'dismiss') => {
    setActionLoading(id);
    try {
      const status = action === 'resolve' ? 'RESOLVED' as const : 'DISMISSED' as const;
      await adminApi.resolveReport(id, status, resolveNotes);
      setResolvingId(null);
      setResolveNotes('');
      if (action === 'resolve') {
        toast({
          title: t('toast.reportResolved'),
          description: t('toast.reportResolvedDesc'),
          variant: 'success',
        });
      } else {
        toast({
          title: t('toast.reportDismissed'),
          description: t('toast.reportDismissedDesc'),
          variant: 'success',
        });
      }
    } catch (err) {
      console.error('Failed to resolve report:', err);
      toast({
        title: t('toast.error'),
        description: action === 'resolve'
          ? t('toast.reportResolveError')
          : t('toast.reportDismissError'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  }, [resolveNotes, t]);

  // Get current reports based on tab filter, then apply search and reason filter
  const reports = useMemo(() => {
    const baseReports = filter === 'PENDING' ? pendingReports : allReports;
    return baseReports.filter((report) => {
      if (reasonFilter !== 'all' && report.reason !== reasonFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const name = (report.reporterName || '').toLowerCase();
        const email = (report.reporterEmail || '').toLowerCase();
        const details = (report.details || '').toLowerCase();
        if (!name.includes(query) && !email.includes(query) && !details.includes(query)) return false;
      }
      return true;
    });
  }, [filter, pendingReports, allReports, searchQuery, reasonFilter]);
  const isLoading = filter === 'PENDING' ? isLoadingPending : isLoadingAll;

  const getReasonBadgeVariant = useCallback((reason: string) => {
    switch (reason) {
      case 'HARASSMENT':
      case 'SAFETY':
        return 'destructive';
      case 'SPAM':
      case 'FAKE':
        return 'warning';
      default:
        return 'secondary';
    }
  }, []);

  const getTargetLink = useCallback((report: Report) => {
    const baseUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';
    switch (report.targetType) {
      case 'PROJECT':
        return `${baseUrl}/projects/${report.targetId}`;
      case 'USER':
        return `${baseUrl}/profile/${report.targetId}`;
      default:
        return null;
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-eco-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
          <p className="text-muted-foreground">
            {t('reports.subtitle')}
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('reports.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={reasonFilter} onValueChange={setReasonFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('reports.allReasons')}</SelectItem>
              <SelectItem value="INAPPROPRIATE">{t('reports.reasons.inappropriate')}</SelectItem>
              <SelectItem value="MISLEADING">{t('reports.reasons.misleading')}</SelectItem>
              <SelectItem value="SPAM">{t('reports.reasons.spam')}</SelectItem>
              <SelectItem value="HARASSMENT">{t('reports.reasons.harassment')}</SelectItem>
              <SelectItem value="FAKE">{t('reports.reasons.fake')}</SelectItem>
              <SelectItem value="SAFETY">{t('reports.reasons.safety')}</SelectItem>
              <SelectItem value="OTHER">{t('reports.reasons.other')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'PENDING' | 'all')} className="w-full">
          <div className="flex justify-start">
            <TabsList>
              <TabsTrigger value="PENDING" className="flex items-center gap-2">
                {t('reports.pending')}
                <Badge variant="warning" className="ml-1">
                  {pendingReports.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                {t('reports.allReports')}
                <Badge variant="secondary" className="ml-1">
                  {allReports.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={filter} className="mt-6">
            {/* Reports List */}
            {reports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  {(searchQuery.trim() || reasonFilter !== 'all') ? (
                    <>
                      <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">{t('reports.noMatchingReports')}</h3>
                    </>
                  ) : (
                    <>
                      <Flag className="w-12 h-12 mx-auto text-eco-primary mb-4" />
                      <h3 className="text-lg font-medium">{t('reports.noReports')}</h3>
                      <p className="text-muted-foreground">
                        {filter === 'PENDING'
                          ? t('reports.noPendingReports')
                          : t('reports.noReportsFound')}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
              <Card key={report._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <span>{t('reports.report')} #{report._id}</span>
                        <Badge variant={getReasonBadgeVariant(report.reason)}>
                          {report.reason}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {report.targetType} (ID: {report.targetId})
                      </p>
                    </div>
                    <Badge variant={report.status === 'PENDING' ? 'warning' : 'secondary'}>
                      {report.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">{t('reports.reportedBy')}:</span>{' '}
                      {report.reporterName} ({report.reporterEmail})
                    </div>

                    {report.details && (
                      <div className="text-sm bg-gray-50 p-3 rounded-lg">
                        {report.details}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {t('reports.submitted')} {formatDateTime(report._creationTime)}
                    </div>

                    {report.status === 'PENDING' && (
                      <>
                        {resolvingId === report._id ? (
                          <div className="space-y-3 pt-2">
                            <Input
                              placeholder={t('reports.adminNotes')}
                              value={resolveNotes}
                              onChange={(e) => setResolveNotes(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleResolve(report._id, 'resolve')}
                                disabled={actionLoading === report._id}
                              >
                                {actionLoading === report._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                ) : (
                                  <Check className="w-4 h-4 mr-1" />
                                )}
                                {t('reports.markResolved')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolve(report._id, 'dismiss')}
                                disabled={actionLoading === report._id}
                              >
                                <X className="w-4 h-4 mr-1" />
                                {t('reports.dismiss')}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setResolvingId(null);
                                  setResolveNotes('');
                                }}
                              >
                                {t('common.cancel')}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => setResolvingId(report._id)}
                            >
                              {t('reports.takeAction')}
                            </Button>
                            {getTargetLink(report) && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <a
                                  href={getTargetLink(report)!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {t('reports.view')} {report.targetType}
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
}
