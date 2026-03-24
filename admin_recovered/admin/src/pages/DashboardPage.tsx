import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { Users, FolderOpen, UserCheck, Flag, ArrowRight, Loader2, MessageCircle, Heart, Globe, Wrench, TrendingUp, Star, Info } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { adminApi, type DashboardStats } from '@/services/api';
import { cn } from '@/lib/utils';

export function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      setError(t('dashboard.failedToLoad'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = useMemo(() => [
    {
      title: t('dashboard.totalUsers'),
      value: stats?.users.total || 0,
      subtitle: `+${stats?.users.new_this_month || 0} ${t('common.thisMonth')}`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      tooltip: t('dashboard.tooltips.totalUsers'),
    },
    {
      title: t('dashboard.activeProjects'),
      value: stats?.projects.active || 0,
      subtitle: `${stats?.projects.pending || 0} ${t('common.pendingValidation')}`,
      icon: FolderOpen,
      color: 'text-eco-primary',
      bgColor: 'bg-green-100',
      link: '/projects',
      linkLabel: t('dashboard.viewPending'),
      highlight: (stats?.projects.pending || 0) > 0,
      tooltip: t('dashboard.tooltips.activeProjects'),
    },
    {
      title: t('dashboard.conversionRate'),
      value: `${stats?.participations.conversion_rate || 0}%`,
      subtitle: t('dashboard.conversionRateDesc'),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      tooltip: t('dashboard.tooltips.conversionRate'),
    },
    {
      title: t('dashboard.pendingReports'),
      value: stats?.reports.pending || 0,
      subtitle: t('common.requireReview'),
      icon: Flag,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      link: '/reports',
      linkLabel: t('dashboard.reviewReports'),
      highlight: (stats?.reports.pending || 0) > 0,
      tooltip: t('dashboard.tooltips.pendingReports'),
    },
  ], [stats, t]);

  const secondaryStats = useMemo(() => [
    {
      title: t('dashboard.totalMessages'),
      value: stats?.messages.total || 0,
      icon: MessageCircle,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      tooltip: t('dashboard.tooltips.totalMessages'),
    },
    {
      title: t('dashboard.totalFavorites'),
      value: stats?.favorites.total || 0,
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      tooltip: t('dashboard.tooltips.totalFavorites'),
    },
    {
      title: t('dashboard.hostsWithProjects'),
      value: stats?.users.with_projects || 0,
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      tooltip: t('dashboard.tooltips.hostsWithProjects'),
    },
    {
      title: t('dashboard.averageRating'),
      value: stats?.reviews.average_rating ? stats.reviews.average_rating.toFixed(1) : '-',
      subtitle: `${stats?.reviews.total || 0} ${t('dashboard.totalReviews')}`,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      tooltip: t('dashboard.tooltips.averageRating'),
    },
  ], [stats, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-eco-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchStats} className="mt-4">
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.welcome')}
          </p>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card
              key={stat.title}
              className={cn(
                'relative overflow-hidden',
                stat.highlight && 'ring-2 ring-eco-primary'
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  {stat.title}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{stat.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                  <stat.icon className={cn('w-4 h-4', stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
                {stat.link && (
                  <Link
                    to={stat.link}
                    className="inline-flex items-center gap-1 mt-3 text-sm text-eco-primary hover:underline"
                  >
                    {stat.linkLabel}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {secondaryStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  {stat.title}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{stat.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                  <stat.icon className={cn('w-4 h-4', stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.subtitle}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform Activity Chart */}
        {stats?.activity && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('dashboard.platformActivity')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.platformActivityDesc')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(() => {
                      const usersByDay = stats.activity.users_by_day || [];
                      const projectsByDay = stats.activity.projects_by_day || [];
                      const dateMap = new Map<string, { date: string; users: number; projects: number }>();

                      usersByDay.forEach((d) => {
                        dateMap.set(d.date, { date: d.date, users: d.count, projects: 0 });
                      });
                      projectsByDay.forEach((d) => {
                        const existing = dateMap.get(d.date);
                        if (existing) {
                          existing.projects = d.count;
                        } else {
                          dateMap.set(d.date, { date: d.date, users: 0, projects: d.count });
                        }
                      });

                      return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
                    })()}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value: string) => {
                        const d = new Date(value);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <RechartsTooltip
                      labelFormatter={(label: string) => {
                        const d = new Date(label);
                        return d.toLocaleDateString(i18n.language, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        });
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="users"
                      name={t('dashboard.newUsers')}
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="projects"
                      name={t('dashboard.newProjects')}
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('dashboard.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/projects">
                <Button variant="outline" className="w-full justify-start">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  {t('dashboard.reviewPendingProjects')}
                  {(stats?.projects.pending || 0) > 0 && (
                    <span className="ml-auto bg-eco-primary text-white text-xs px-2 py-0.5 rounded-full">
                      {stats?.projects.pending}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/reports">
                <Button variant="outline" className="w-full justify-start">
                  <Flag className="w-4 h-4 mr-2" />
                  {t('dashboard.reviewReports')}
                  {(stats?.reports.pending || 0) > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {stats?.reports.pending}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/users">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  {t('dashboard.manageUsers')}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('dashboard.platformOverview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('dashboard.totalProjects')}</span>
                  <span className="font-medium">{stats?.projects.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('dashboard.activeProjects')}</span>
                  <span className="font-medium">{stats?.projects.active || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('dashboard.totalParticipations')}</span>
                  <span className="font-medium">{stats?.participations.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('dashboard.acceptedParticipations')}</span>
                  <span className="font-medium">{stats?.participations.accepted || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Countries and Popular Skills */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">{t('dashboard.topCountries')}</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              {stats?.top_countries && stats.top_countries.length > 0 ? (
                <div className="space-y-3">
                  {stats.top_countries.map((country, index) => (
                    <div key={country.address__country__code || index} className="flex justify-between items-center">
                      <span className="text-sm">
                        {country.address__country__name || t('dashboard.unknown')}
                      </span>
                      <span className="text-sm font-medium bg-gray-100 px-2 py-0.5 rounded">
                        {country.count} {country.count === 1 ? t('dashboard.project') : t('dashboard.projects')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('dashboard.noData')}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">{t('dashboard.popularSkills')}</CardTitle>
              <div className="p-2 rounded-lg bg-orange-100">
                <Wrench className="w-4 h-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              {stats?.popular_skills && stats.popular_skills.length > 0 ? (
                <div className="space-y-3">
                  {stats.popular_skills.map((skill) => (
                    <div key={skill.code} className="flex justify-between items-center">
                      <span className="text-sm">
                        {i18n.language === 'fr' ? skill.display_name_fr : skill.display_name_en}
                      </span>
                      <span className="text-sm font-medium bg-gray-100 px-2 py-0.5 rounded">
                        {skill.project_count} {skill.project_count === 1 ? t('dashboard.project') : t('dashboard.projects')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('dashboard.noData')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
