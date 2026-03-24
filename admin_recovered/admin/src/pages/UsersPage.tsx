import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/useToast';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adminApi } from '@/services/api';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Mail,
  MailX,
  MailCheck,
  Trash2,
  AlertTriangle,
  Crown,
  Star,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldBan,
  ShieldCheck,
} from 'lucide-react';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  profile_picture: string | null;
  is_active: boolean;
  is_staff: boolean;
  email_verified: boolean;
  average_rating: number;
  review_count: number;
  created_at: string;
  last_login_at: string | null;
}

interface UsersResponse {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: User[];
}

type SortField = 'created_at' | 'last_login_at' | 'average_rating' | 'full_name';
type SortOrder = 'asc' | 'desc';

export function UsersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [userToBlock, setUserToBlock] = useState<User | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch users
  const { data, isLoading, error } = useQuery<UsersResponse>({
    queryKey: ['admin-users', search, page, pageSize, verifiedFilter, sortField, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (verifiedFilter !== null) params.append('email_verified', String(verifiedFilter));
      params.append('page', String(page));
      params.append('page_size', String(pageSize));
      params.append('ordering', sortOrder === 'desc' ? `-${sortField}` : sortField);
      return adminApi.get<UsersResponse>(`/admin/users/?${params.toString()}`);
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (userId: number) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setUserToDelete(null);
      setDeleteError(null);
      toast({
        title: t('toast.userDeleted'),
        description: t('toast.userDeletedDesc'),
        variant: 'success',
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      setDeleteError(err.response?.data?.error || t('users.failedToDelete'));
      toast({
        title: t('toast.error'),
        description: t('toast.userDeleteError'),
        variant: 'destructive',
      });
    },
  });

  // Toggle email verification mutation
  const toggleEmailVerificationMutation = useMutation({
    mutationFn: async ({ userId, verified }: { userId: number; verified: boolean }) => {
      if (verified) {
        await adminApi.unverifyUserEmail(userId);
      } else {
        await adminApi.verifyUserEmail(userId);
      }
      return { verified };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (variables.verified) {
        toast({
          title: t('toast.emailUnverified'),
          description: t('toast.emailUnverifiedDesc'),
          variant: 'success',
        });
      } else {
        toast({
          title: t('toast.emailVerified'),
          description: t('toast.emailVerifiedDesc'),
          variant: 'success',
        });
      }
    },
    onError: (_error, variables) => {
      toast({
        title: t('toast.error'),
        description: variables.verified
          ? t('toast.emailUnverifyError')
          : t('toast.emailVerifyError'),
        variant: 'destructive',
      });
    },
  });

  // Block user mutation (with confirmation dialog)
  const blockMutation = useMutation({
    mutationFn: (userId: number) => adminApi.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setUserToBlock(null);
      setBlockError(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      setBlockError(err.response?.data?.error || t('users.failedToBlock'));
    },
  });

  // Unblock user mutation (no confirmation needed)
  const unblockMutation = useMutation({
    mutationFn: (userId: number) => adminApi.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const handleBlockUser = useCallback(() => {
    if (userToBlock) {
      blockMutation.mutate(userToBlock.id);
    }
  }, [userToBlock, blockMutation]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleDeleteUser = useCallback(() => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  }, [userToDelete, deleteMutation]);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortOrder((prevOrder) => prevOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortOrder('desc');
      }
      return field;
    });
    setPage(1);
  }, []);

  const getSortIcon = useCallback((field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="w-4 h-4 ml-1" />
      : <ArrowDown className="w-4 h-4 ml-1" />;
  }, [sortField, sortOrder]);

  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  // Rating display component
  const RatingDisplay = ({ rating, reviewCount }: { rating: number; reviewCount: number }) => {
    const displayRating = Number(rating || 0);
    const hasReviews = reviewCount > 0;

    return (
      <div className="flex items-center justify-center gap-1.5">
        {hasReviews ? (
          <>
            <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-amber-700">{displayRating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({reviewCount})
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground italic">{t('users.noReviews')}</span>
        )}
      </div>
    );
  };

  // Calculate pagination info
  const startItem = data ? (data.page - 1) * data.page_size + 1 : 0;
  const endItem = data ? Math.min(data.page * data.page_size, data.count) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('users.title')}</h1>
        <p className="text-muted-foreground">
          {t('users.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('users.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">{t('common.search')}</Button>
        </form>

        <div className="flex gap-2">
          <Button
            variant={verifiedFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setVerifiedFilter(null);
              setPage(1);
            }}
          >
            {t('common.all')}
          </Button>
          <Button
            variant={verifiedFilter === true ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setVerifiedFilter(true);
              setPage(1);
            }}
          >
            <Mail className="w-4 h-4 mr-1" />
            {t('users.verified')}
          </Button>
          <Button
            variant={verifiedFilter === false ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setVerifiedFilter(false);
              setPage(1);
            }}
          >
            <MailX className="w-4 h-4 mr-1" />
            {t('users.unverified')}
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('nav.users')}
          </CardTitle>
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('users.rowsPerPage')}:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              {t('users.errorLoading')}
            </div>
          ) : data?.results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('users.noUsersFound')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">
                    <button
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort('full_name')}
                    >
                      {t('users.user')}
                      {getSortIcon('full_name')}
                    </button>
                  </TableHead>
                  <TableHead>{t('users.email')}</TableHead>
                  <TableHead className="text-center">
                    <button
                      className="flex items-center justify-center w-full hover:text-foreground transition-colors"
                      onClick={() => handleSort('average_rating')}
                    >
                      {t('users.rating')}
                      {getSortIcon('average_rating')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort('created_at')}
                    >
                      {t('users.joined')}
                      {getSortIcon('created_at')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort('last_login_at')}
                    >
                      {t('users.lastLogin')}
                      {getSortIcon('last_login_at')}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">{t('users.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results.map((user) => (
                  <TableRow key={user.id}>
                    {/* User */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.profile_picture ? (
                          <img
                            src={user.profile_picture}
                            alt={user.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Users className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">{user.full_name}</span>
                            {user.is_staff && (
                              <Crown className="w-4 h-4 text-yellow-500" aria-label={t('users.staff')} />
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>

                    {/* Rating */}
                    <TableCell>
                      <RatingDisplay rating={user.average_rating} reviewCount={user.review_count} />
                    </TableCell>

                    {/* Joined */}
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(user.created_at)}
                    </TableCell>

                    {/* Last Login */}
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(user.last_login_at)}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {!user.is_active && (
                          <Badge variant="destructive" className="bg-red-600">
                            <ShieldBan className="w-3 h-3 mr-1" />
                            {t('users.blocked')}
                          </Badge>
                        )}
                        {user.email_verified ? (
                          <Badge variant="default" className="bg-green-500">
                            <MailCheck className="w-3 h-3 mr-1" />
                            {t('users.verified')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            <MailX className="w-3 h-3 mr-1" />
                            {t('users.unverified')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Toggle email verification */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEmailVerificationMutation.mutate({
                            userId: user.id,
                            verified: user.email_verified
                          })}
                          disabled={toggleEmailVerificationMutation.isPending}
                          title={user.email_verified ? t('users.clickToUnverify') : t('users.clickToVerify')}
                          className={user.email_verified ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                        >
                          {user.email_verified ? <MailX className="w-4 h-4" /> : <MailCheck className="w-4 h-4" />}
                        </Button>
                        {/* Block / Unblock toggle */}
                        {user.email.toLowerCase() !== 'aurelien_lef@hotmail.fr' && !user.is_staff && (
                          user.is_active ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUserToBlock(user);
                                setBlockError(null);
                              }}
                              title={t('users.clickToBlock')}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <ShieldBan className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => unblockMutation.mutate(user.id)}
                              disabled={unblockMutation.isPending}
                              title={t('users.clickToUnblock')}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </Button>
                          )
                        )}
                        {/* Protected admin email cannot be deleted */}
                        {user.email.toLowerCase() !== 'aurelien_lef@hotmail.fr' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteError(null);
                          }}
                          title={t('users.deleteUser')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {data && data.count > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {t('users.showingItems', { start: startItem, end: endItem, total: data.count })}
              </div>
              <div className="flex items-center gap-1">
                {/* First page */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  title={t('users.firstPage')}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                {/* Previous page */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  title={t('common.previous')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, data.total_pages) }, (_, i) => {
                    let pageNum: number;
                    if (data.total_pages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= data.total_pages - 2) {
                      pageNum = data.total_pages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                {/* Next page */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                  disabled={page >= data.total_pages}
                  title={t('common.next')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                {/* Last page */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(data.total_pages)}
                  disabled={page >= data.total_pages}
                  title={t('users.lastPage')}
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {t('users.deleteUser')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              {t('users.deleteConfirmation')} <strong>{userToDelete?.full_name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground mb-2">{t('users.deleteWarning')}</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>{t('users.deleteItem1')}</li>
              <li>{t('users.deleteItem2')}</li>
              <li>{t('users.deleteItem3')}</li>
              <li>{t('users.deleteItem4')}</li>
            </ul>
            <p className="text-amber-600 font-medium text-sm mt-4">
              {t('users.deleteNote')}
            </p>
          </div>
          {deleteError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {deleteError}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('users.deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('users.deleteUser')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Confirmation Modal */}
      <Dialog open={!!userToBlock} onOpenChange={() => setUserToBlock(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldBan className="w-5 h-5" />
              {t('users.blockUser')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              {t('users.blockConfirmation')} <strong>{userToBlock?.full_name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              {t('users.blockWarning')}
            </p>
          </div>
          {blockError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {blockError}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserToBlock(null)}
              disabled={blockMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockUser}
              disabled={blockMutation.isPending}
            >
              {blockMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('users.blocking')}
                </>
              ) : (
                <>
                  <ShieldBan className="w-4 h-4 mr-2" />
                  {t('users.blockUser')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
