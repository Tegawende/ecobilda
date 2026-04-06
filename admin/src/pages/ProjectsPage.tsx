import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import {
  Check,
  X,
  Eye,
  Loader2,
  AlertCircle,
  MapPin,
  Calendar,
  Undo2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Wifi,
  Dog,
  Baby,
  Home,
  Leaf,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { adminApi, type ProjectDetail } from '@/services/api';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { getSkillIcon } from '@/lib/skillIcons';

// Project Card with frontend-style UI
function ProjectCard({
  projectId,
  isValidated,
  onValidate,
  onInvalidate,
  onReject,
  actionLoading,
  onLoaded,
}: {
  projectId: string;
  isValidated: boolean;
  onValidate: (id: string) => Promise<void>;
  onInvalidate: (id: string, reason?: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  actionLoading: string | null;
  onLoaded?: (id: string, detail: ProjectDetail) => void;
}) {
  const { t } = useTranslation();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [invalidatingId, setInvalidatingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [invalidateReason, setInvalidateReason] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await adminApi.getProjectDetail(projectId);
        setProject(data);
        onLoaded?.(projectId, data);
      } catch (err) {
        console.error('Failed to fetch project:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [projectId, onLoaded]);

  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000';
  const images = project?.images && project.images.length > 0
    ? project.images.filter(img => img.url).map(img => {
        const url = img.url!;
        // Relative URLs point to frontend public assets
        return url.startsWith('/') ? `${frontendUrl}${url}` : url;
      })
    : [];

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => Math.min(prev + 1, images.length - 1));
  }, [images.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleValidateClick = async () => {
    await onValidate(projectId);
  };

  const handleRejectClick = async () => {
    if (!rejectReason.trim()) return;
    await onReject(projectId, rejectReason);
    setRejectingId(null);
    setRejectReason('');
  };

  const handleInvalidateClick = async () => {
    await onInvalidate(projectId, invalidateReason || undefined);
    setInvalidatingId(null);
    setInvalidateReason('');
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-56 aspect-[4/3] bg-gray-200 flex-shrink-0" />
          <CardContent className="flex-1 p-4 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="flex gap-2">
              <div className="h-5 bg-gray-200 rounded w-16" />
              <div className="h-5 bg-gray-200 rounded w-16" />
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  if (!project) {
    return null;
  }

  const isNatB = project.projectType === 'NATURAL_BUILDING' || project.projectType === 'NATB';

  return (
    <Card className="group overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Sliding Image Carousel - Left Side (compact) */}
        <div className="relative w-full sm:w-56 aspect-[4/3] flex-shrink-0 overflow-hidden bg-gray-100">
          {images.length > 0 ? (
            <>
              {/* Horizontal image strip with slide animation */}
              <div
                className="flex h-full transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
              >
                {images.map((imageSrc, idx) => (
                  <img
                    key={imageSrc}
                    src={imageSrc}
                    alt={`${project.title} - Image ${idx + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover flex-shrink-0"
                    style={{ minWidth: '100%' }}
                  />
                ))}
              </div>

              {/* Image Navigation - Finite (hidden at boundaries) */}
              {images.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer z-10 shadow-sm text-gray-800"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  {currentImageIndex < images.length - 1 && (
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer z-10 shadow-sm text-gray-800"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}

                  {/* Dots */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                    {images.map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          idx === currentImageIndex ? 'bg-white w-2' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              {t('projectDetail.noImages')}
            </div>
          )}

          {/* Type Badge - Top Left */}
          <div className="absolute top-3 left-3 z-10">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm uppercase tracking-wider ${
              isNatB ? 'bg-eco-primary text-white' : 'bg-amber-600 text-white'
            }`}>
              {isNatB ? <Home size={10} /> : <Leaf size={10} />}
              {isNatB ? t('projects.ecoConstruction') : t('projects.permaculture')}
            </span>
          </div>
        </div>

        {/* Content - Right Side */}
        <CardContent className="flex-1 p-4 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-gray-900 text-lg flex-1">
              {project.title}
            </h3>
            {/* Status Badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
              isValidated ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {isValidated ? t('projects.validated') : t('projects.pending')}
            </span>
          </div>

          {/* Owner info */}
          <p className="text-sm text-gray-500 mb-1">
            {t('projects.by')} {project.owner.firstName} {project.owner.lastName}
            {project.owner.email && (
              <span className="text-gray-400 ml-1">({project.owner.email})</span>
            )}
          </p>

          {/* Location */}
          <div className="flex items-center text-gray-500 text-sm mb-2">
            <MapPin size={14} className="mr-1 flex-shrink-0" />
            <span className="truncate">
              {project.address?.city}, {project.address?.country?.name}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
            {project.maxHelpers && (
              <span className="flex items-center gap-1">
                <Users size={14} />
                {project.maxHelpers} {t('projectDetail.maxHelpers')}
              </span>
            )}
            {project.hoursPerDay && (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {project.hoursPerDay}h/{t('projectDetail.day')}
              </span>
            )}
          </div>

          {/* Amenities & Skills */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {project.internetProvided && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                <Wifi size={10} /> {t('projectDetail.wifi')}
              </span>
            )}
            {project.familyFriendly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                <Baby size={10} /> {t('projectDetail.familyFriendly')}
              </span>
            )}
            {project.petsAllowed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                <Dog size={10} /> {t('projectDetail.pets')}
              </span>
            )}
            {project.skills && project.skills.slice(0, 3).map((skill) => {
              const SkillIcon = getSkillIcon(skill.code);
              return (
                <Badge key={skill.code} variant="secondary" className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0">
                  <SkillIcon size={9} />
                  {i18n.language === 'fr' ? skill.displayNameFr : skill.displayNameEn}
                </Badge>
              );
            })}
            {project.skills && project.skills.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{project.skills.length - 3}
              </Badge>
            )}
          </div>

          {/* Dates */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {t('projects.submitted')} {formatDate(project._creationTime)}
            </span>
            {isValidated && project.validatedAt && (
              <span className="flex items-center gap-1 text-green-600">
                <Check size={12} />
                {t('projects.validatedOn')} {formatDate(project.validatedAt)}
              </span>
            )}
          </div>

          {/* Actions - Push to bottom */}
          <div className="mt-auto pt-3 border-t">
            {isValidated ? (
              invalidatingId === projectId ? (
                <div className="space-y-2">
                  <Input
                    placeholder={t('projects.enterInvalidationReason')}
                    value={invalidateReason}
                    onChange={(e) => setInvalidateReason(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleInvalidateClick}
                      disabled={actionLoading === projectId}
                      className="h-8"
                    >
                      {actionLoading === projectId ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Undo2 className="w-4 h-4 mr-1" />
                      )}
                      {t('projects.confirmInvalidate')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInvalidatingId(null);
                        setInvalidateReason('');
                      }}
                      className="h-8"
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInvalidatingId(projectId)}
                    className="h-8"
                  >
                    <Undo2 className="w-4 h-4 mr-1" />
                    {t('projects.invalidate')}
                  </Button>
                  <Button variant="outline" size="sm" asChild className="h-8">
                    <a
                      href={`${import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/projects/${projectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {t('projects.preview')}
                    </a>
                  </Button>
                </div>
              )
            ) : (
              rejectingId === projectId ? (
                <div className="space-y-2">
                  <Input
                    placeholder={t('projects.enterRejectionReason')}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRejectClick}
                      disabled={!rejectReason.trim() || actionLoading === projectId}
                      className="h-8"
                    >
                      {actionLoading === projectId ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <X className="w-4 h-4 mr-1" />
                      )}
                      {t('projects.confirmReject')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason('');
                      }}
                      className="h-8"
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={handleValidateClick}
                    disabled={actionLoading === projectId}
                    className="h-8"
                  >
                    {actionLoading === projectId ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    {t('projects.approve')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRejectingId(projectId)}
                    className="h-8"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {t('projects.reject')}
                  </Button>
                  <Button variant="outline" size="sm" asChild className="h-8">
                    <a
                      href={`${import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/projects/${projectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {t('projects.preview')}
                    </a>
                  </Button>
                </div>
              )
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export function ProjectsPage() {
  const { t } = useTranslation();
  const [pendingProjectIds, setPendingProjectIds] = useState<string[]>([]);
  const [validatedProjectIds, setValidatedProjectIds] = useState<string[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isLoadingValidated, setIsLoadingValidated] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'PERMACULTURE' | 'NATURAL_BUILDING'>('all');
  const [projectDetailsCache, setProjectDetailsCache] = useState<Map<string, ProjectDetail>>(new Map());

  const handleProjectLoaded = useCallback((id: string, detail: ProjectDetail) => {
    setProjectDetailsCache((prev) => {
      const next = new Map(prev);
      next.set(id, detail);
      return next;
    });
  }, []);

  const filterProjectIds = useCallback((ids: string[]) => {
    const query = searchQuery.toLowerCase().trim();
    return ids.filter((id) => {
      const detail = projectDetailsCache.get(id);
      if (!detail) return true; // Show cards that haven't loaded yet
      if (typeFilter !== 'all') {
        const type = detail.projectType;
        if (typeFilter === 'NATURAL_BUILDING' && type !== 'NATURAL_BUILDING' && type !== 'NATB') return false;
        if (typeFilter === 'PERMACULTURE' && type !== 'PERMACULTURE' && type !== 'PERM') return false;
      }
      if (query) {
        const title = detail.title?.toLowerCase() || '';
        const ownerName = `${detail.owner?.firstName || ''} ${detail.owner?.lastName || ''}`.toLowerCase();
        if (!title.includes(query) && !ownerName.includes(query)) return false;
      }
      return true;
    });
  }, [searchQuery, typeFilter, projectDetailsCache]);

  const filteredPendingIds = useMemo(
    () => filterProjectIds(pendingProjectIds),
    [filterProjectIds, pendingProjectIds]
  );
  const filteredValidatedIds = useMemo(
    () => filterProjectIds(validatedProjectIds),
    [filterProjectIds, validatedProjectIds]
  );

  const fetchPendingProjects = useCallback(async () => {
    try {
      setIsLoadingPending(true);
      const data: any = await adminApi.getPendingProjects();
      const projects = Array.isArray(data) ? data : data.results || [];
      setPendingProjectIds(projects.map((p: { _id: string }) => p._id));
    } catch (err) {
      setError(t('projects.failedToLoad'));
      console.error(err);
    } finally {
      setIsLoadingPending(false);
    }
  }, [t]);

  const fetchValidatedProjects = useCallback(async () => {
    try {
      setIsLoadingValidated(true);
      const data: any = await adminApi.getValidatedProjects();
      const projects = Array.isArray(data) ? data : data.results || [];
      setValidatedProjectIds(projects.map((p: { _id: string }) => p._id));
    } catch (err) {
      console.error('Failed to fetch validated projects:', err);
    } finally {
      setIsLoadingValidated(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingProjects();
    fetchValidatedProjects();
  }, [fetchPendingProjects, fetchValidatedProjects]);

  const handleValidate = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.validateProject(id);
      setPendingProjectIds((prev) => prev.filter((pid) => pid !== id));
      setValidatedProjectIds((prev) => [id, ...prev]);
      toast({
        title: t('toast.projectApproved'),
        description: t('toast.projectApprovedDesc'),
        variant: 'success',
      });
    } catch (err) {
      console.error('Failed to validate project:', err);
      toast({
        title: t('toast.error'),
        description: t('toast.projectApproveError'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  }, [t]);

  const handleInvalidate = useCallback(async (id: string, reason?: string) => {
    setActionLoading(id);
    try {
      await adminApi.invalidateProject(id);
      setValidatedProjectIds((prev) => prev.filter((pid) => pid !== id));
      setPendingProjectIds((prev) => [id, ...prev]);
      toast({
        title: t('toast.projectInvalidated'),
        description: t('toast.projectInvalidatedDesc'),
        variant: 'success',
      });
    } catch (err) {
      console.error('Failed to invalidate project:', err);
      toast({
        title: t('toast.error'),
        description: t('toast.projectInvalidateError'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  }, [t]);

  const handleReject = useCallback(async (id: string, reason: string) => {
    setActionLoading(id);
    try {
      await adminApi.rejectProject(id, reason);
      setPendingProjectIds((prev) => prev.filter((pid) => pid !== id));
      toast({
        title: t('toast.projectRejected'),
        description: t('toast.projectRejectedDesc'),
        variant: 'success',
      });
    } catch (err) {
      console.error('Failed to reject project:', err);
      toast({
        title: t('toast.error'),
        description: t('toast.projectRejectError'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  }, [t]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('projects.title')}</h1>
        <p className="text-muted-foreground">{t('projects.subtitle')}</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('projects.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | 'PERMACULTURE' | 'NATURAL_BUILDING')}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('projects.allTypes')}</SelectItem>
            <SelectItem value="PERMACULTURE">{t('projects.permaculture')}</SelectItem>
            <SelectItem value="NATURAL_BUILDING">{t('projects.ecoConstruction')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <Tabs defaultValue="pending" className="w-full">
        <div className="flex justify-start">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              {t('projects.pending')}
              <Badge variant="warning" className="ml-1">
                {pendingProjectIds.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="validated" className="flex items-center gap-2">
              {t('projects.validated')}
              <Badge variant="success" className="ml-1">
                {validatedProjectIds.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="mt-6">
          {isLoadingPending ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-eco-primary" />
            </div>
          ) : pendingProjectIds.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Check className="w-12 h-12 mx-auto text-eco-primary mb-4" />
                <h3 className="text-lg font-medium">{t('projects.allCaughtUp')}</h3>
                <p className="text-muted-foreground">{t('projects.noPendingProjects')}</p>
              </CardContent>
            </Card>
          ) : filteredPendingIds.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t('projects.noMatchingProjects')}</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPendingIds.map((id) => (
                <ProjectCard
                  key={id}
                  projectId={id}
                  isValidated={false}
                  onValidate={handleValidate}
                  onInvalidate={handleInvalidate}
                  onReject={handleReject}
                  actionLoading={actionLoading}
                  onLoaded={handleProjectLoaded}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="validated" className="mt-6">
          {isLoadingValidated ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-eco-primary" />
            </div>
          ) : validatedProjectIds.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t('projects.noValidatedProjects')}</h3>
                <p className="text-muted-foreground">{t('projects.noValidatedProjectsDesc')}</p>
              </CardContent>
            </Card>
          ) : filteredValidatedIds.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t('projects.noMatchingProjects')}</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredValidatedIds.map((id) => (
                <ProjectCard
                  key={id}
                  projectId={id}
                  isValidated={true}
                  onValidate={handleValidate}
                  onInvalidate={handleInvalidate}
                  onReject={handleReject}
                  actionLoading={actionLoading}
                  onLoaded={handleProjectLoaded}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
