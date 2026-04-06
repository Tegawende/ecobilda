import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminApi, AdminUserDetail } from '@/services/api';
import { getSkillIcon } from '@/lib/skillIcons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/useToast';
import {
  ArrowLeft,
  Loader2,
  MailCheck,
  MailX,
  ShieldBan,
  ShieldCheck,
  Crown,
  Star,
  MapPin,
  Calendar,
  User as UserIcon,
  Globe,
  Bell,
  FolderOpen,
  MessageSquare,
  Eye,
} from 'lucide-react';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<AdminUserDetail>({
    queryKey: ['admin-user-detail', id],
    queryFn: () => adminApi.getUserDetail(id!),
    enabled: !!id,
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (userId: string) => {
      await adminApi.verifyUserEmail(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: t('toast.emailVerified'),
        description: t('toast.emailVerifiedDesc'),
        variant: 'success',
      });
    },
    onError: () => {
      toast({
        title: t('toast.error'),
        description: t('toast.emailVerifyError'),
        variant: 'destructive',
      });
    },
  });

  const blockMutation = useMutation({
    mutationFn: (userId: string) => adminApi.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => adminApi.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500">{status}</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">{status}</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">{status}</Badge>;
      case 'DRAFT':
        return <Badge variant="outline">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getGenderLabel = (gender: string) => {
    if (!gender) return '-';
    return t(`userDetail.genders.${gender}`, gender);
  };

  const getSkillName = (skill: AdminUserDetail['skills'][0]) => {
    return skill.displayNameEn;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/users')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('userDetail.backToUsers')}
        </Button>
        <div className="text-center py-12 text-red-500">
          {t('userDetail.failedToLoad')}
        </div>
      </div>
    );
  }

  const avatarUrl = user.profilePictureUrl;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate('/users')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('userDetail.backToUsers')}
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${user.firstName} ${user.lastName}`}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
            {initials}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold">{user.firstName} {user.lastName}</h1>
            {user.isStaff && (
              <Badge variant="default" className="bg-yellow-500">
                <Crown className="w-3 h-3 mr-1" />
                Staff
              </Badge>
            )}
            {user.isSuperuser && (
              <Badge variant="default" className="bg-purple-500">
                Superuser
              </Badge>
            )}
            {user.emailVerified ? (
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
            {!user.isActive && (
              <Badge variant="destructive">
                <ShieldBan className="w-3 h-3 mr-1" />
                {t('users.blocked')}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{user.email}</p>
          {user.reviewCount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-amber-700">{user.averageRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({user.reviewCount} {t('users.reviews')})</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {!user.emailVerified && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => verifyEmailMutation.mutate(user._id)}
              disabled={verifyEmailMutation.isPending}
            >
              <MailCheck className="w-4 h-4 mr-1" />
              {t('users.clickToVerify')}
            </Button>
          )}
          {!user.isStaff && (
            user.isActive ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => blockMutation.mutate(user._id)}
                disabled={blockMutation.isPending}
              >
                <ShieldBan className="w-4 h-4 mr-1" />
                {t('users.blockUser')}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-600 hover:bg-green-50"
                onClick={() => unblockMutation.mutate(user._id)}
                disabled={unblockMutation.isPending}
              >
                <ShieldCheck className="w-4 h-4 mr-1" />
                {t('users.unblockUser')}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserIcon className="w-5 h-5" />
              {t('userDetail.personalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('userDetail.dateOfBirth')}</span>
              <span>{formatDate(user.dateOfBirth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('userDetail.gender')}</span>
              <span>{getGenderLabel(user.gender)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('userDetail.languages')}</span>
              <span>
                {user.languages.length > 0
                  ? user.languages.map(l => l.name).join(', ')
                  : <span className="italic text-muted-foreground">{t('userDetail.noLanguages')}</span>
                }
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('userDetail.bio')}</span>
              <p className="mt-1 text-sm">
                {user.bio || <span className="italic text-muted-foreground">{t('userDetail.noBio')}</span>}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5" />
              {t('userDetail.accountInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('users.joined')}</span>
              <span>{formatDate(user._creationTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('users.lastLogin')}</span>
              <span>{formatDate(user.lastLoginAt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('userDetail.projects')}</span>
              <Badge variant="outline">{user.projects.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('userDetail.reviewsReceived')}</span>
              <Badge variant="outline">{user.reviewCount}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5" />
              {t('userDetail.location')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.address ? (
              <div className="space-y-2">
                <p>
                  {[user.address.city, user.address.country?.name].filter(Boolean).join(', ')}
                </p>
              </div>
            ) : (
              <p className="italic text-muted-foreground">{t('userDetail.noAddress')}</p>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5" />
              {t('userDetail.notificationSettings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('userDetail.emailNotifications')}</span>
              <Badge variant={user.emailNotifications ? 'default' : 'secondary'} className={user.emailNotifications ? 'bg-green-500' : ''}>
                {user.emailNotifications ? t('userDetail.enabled') : t('userDetail.disabled')}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('userDetail.newsletter')}</span>
              <Badge variant={user.newsletter ? 'default' : 'secondary'} className={user.newsletter ? 'bg-green-500' : ''}>
                {user.newsletter ? t('userDetail.enabled') : t('userDetail.disabled')}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('userDetail.inAppNotifications')}</span>
              <Badge variant={user.inAppNotifications ? 'default' : 'secondary'} className={user.inAppNotifications ? 'bg-green-500' : ''}>
                {user.inAppNotifications ? t('userDetail.enabled') : t('userDetail.disabled')}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('userDetail.notificationLanguage')}</span>
              <span>{user.notificationLanguage || '-'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5" />
            {t('userDetail.skills')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => {
                const SkillIcon = getSkillIcon(skill.code);
                return (
                  <Badge key={skill.code} variant="outline" className="inline-flex items-center gap-1.5 px-3 py-1">
                    <SkillIcon size={13} />
                    {getSkillName(skill)}
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="italic text-muted-foreground">{t('userDetail.noSkills')}</p>
          )}
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpen className="w-5 h-5" />
            {t('userDetail.projects')} ({user.projects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.projects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>{t('users.status')}</TableHead>
                  <TableHead>{t('users.joined')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.projects.map((project) => (
                  <TableRow key={project._id}>
                    <TableCell className="font-mono text-sm">{project._id}</TableCell>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>{project.projectType}</TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(project._creationTime)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/projects?id=${project._id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="italic text-muted-foreground text-center py-4">{t('userDetail.noProjects')}</p>
          )}
        </CardContent>
      </Card>

      {/* Reviews Received Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5" />
            {t('userDetail.reviewsReceived')} ({user.reviewsReceived.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.reviewsReceived.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Writer</TableHead>
                  <TableHead>{t('users.rating')}</TableHead>
                  <TableHead>Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.reviewsReceived.map((review) => (
                  <TableRow key={review._id}>
                    <TableCell className="font-medium">{review.writerId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{review.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {review.feedback || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="italic text-muted-foreground text-center py-4">{t('userDetail.noReviews')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
