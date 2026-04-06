'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import {
  Container, Title, Text, Group, Stack, ThemeIcon, Alert,
  SimpleGrid, Paper, Button, Avatar, Modal, Textarea, Badge,
} from '@mantine/core';
import {
  IconCompass, IconCircleCheck, IconClock, IconX, IconArrowRight,
  IconStar, IconMessageCircle, IconUser,
} from '@tabler/icons-react';
import { getSessionToken } from '@/lib/convexClient';
import { Layout } from '@/components/common/Layout';

// ─── Half-star rating component ──────────────────────────────────────────────
function HalfStarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <Group gap={4}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fullFill = display >= star;
        const halfFill = !fullFill && display >= star - 0.5;
        return (
          <div
            key={star}
            className="relative cursor-pointer"
            style={{ width: 32, height: 32 }}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Left half → half star */}
            <div
              className="absolute left-0 top-0 w-1/2 h-full z-10"
              onMouseEnter={() => setHovered(star - 0.5)}
              onClick={() => onChange(star - 0.5)}
            />
            {/* Right half → full star */}
            <div
              className="absolute right-0 top-0 w-1/2 h-full z-10"
              onMouseEnter={() => setHovered(star)}
              onClick={() => onChange(star)}
            />
            {/* Star icon with clip for half */}
            <svg width="32" height="32" viewBox="0 0 24 24" style={{ display: 'block' }}>
              {halfFill && (
                <defs>
                  <linearGradient id={`half-${star}`}>
                    <stop offset="50%" stopColor="#facc15" />
                    <stop offset="50%" stopColor="#e5e7eb" />
                  </linearGradient>
                </defs>
              )}
              <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill={
                  fullFill
                    ? '#facc15'
                    : halfFill
                    ? `url(#half-${star})`
                    : '#e5e7eb'
                }
                stroke={fullFill || halfFill ? '#facc15' : '#d1d5db'}
                strokeWidth="1"
              />
            </svg>
          </div>
        );
      })}
      {value > 0 && (
        <Text size="sm" fw={600} c="yellow.6" ml={4}>
          {value}
        </Text>
      )}
    </Group>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
type Status = 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'CANCELLED' | 'EXPIRED';

function StatusBadge({ status }: { status: Status }) {
  const t = useTranslations();
  const cfg: Record<Status, { color: string; icon: typeof IconClock; label: string }> = {
    PENDING:   { color: 'yellow', icon: IconClock,        label: t('participations.pending') },
    ACCEPTED:  { color: 'green',  icon: IconCircleCheck,  label: t('participations.accepted') },
    REFUSED:   { color: 'red',    icon: IconX,            label: t('participations.rejected') },
    CANCELLED: { color: 'gray',   icon: IconX,            label: t('participations.cancelled') },
    EXPIRED:   { color: 'gray',   icon: IconClock,        label: t('participations.expired') },
  };
  const { color, icon: Icon, label } = cfg[status] ?? cfg.PENDING;
  return (
    <Badge color={color} variant="light" radius="xl" leftSection={<Icon size={12} />}>
      {label}
    </Badge>
  );
}

// ─── Review modal ─────────────────────────────────────────────────────────────
function ReviewModal({
  opened,
  onClose,
  host,
  onSubmit,
}: {
  opened: boolean;
  onClose: () => void;
  host: any;
  onSubmit: (rating: number, feedback: string) => Promise<void>;
}) {
  const t = useTranslations();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { setError(t('participations.reviewRatingHint')); return; }
    if (feedback.trim().length < 20) { setError(t('participations.reviewFeedbackRequired')); return; }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(rating, feedback.trim());
      onClose();
    } catch (e: any) {
      setError(e.message?.includes('already') ? t('participations.reviewAlreadyDone') : t('participations.reviewError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="xl" color="eco-primary" variant="light">
            <IconStar size={16} />
          </ThemeIcon>
          <Text fw={600}>{t('participations.reviewModalTitle')}</Text>
        </Group>
      }
      centered
      radius="lg"
      size="lg"
    >
      <Stack gap="lg">
        {/* Host info */}
        {host && (
          <Group gap="sm">
            <Avatar src={host.profilePictureUrl} size="md" radius="xl" color="eco-primary">
              {host.firstName?.[0]}{host.lastName?.[0]}
            </Avatar>
            <Stack gap={0}>
              <Text fw={600} size="sm">{host.firstName} {host.lastName}</Text>
              {host.averageRating > 0 && (
                <Group gap={4}>
                  <IconStar size={12} className="text-eco-terracotta fill-eco-terracotta" />
                  <Text size="xs" c="dimmed">{host.averageRating.toFixed(1)} · {host.reviewCount} avis</Text>
                </Group>
              )}
            </Stack>
          </Group>
        )}

        {/* Star rating */}
        <Stack gap={6}>
          <Text size="sm" fw={600}>{t('participations.reviewRating')}</Text>
          <HalfStarRating value={rating} onChange={setRating} />
        </Stack>

        {/* Feedback */}
        <Textarea
          label={t('participations.reviewFeedback')}
          placeholder={t('participations.reviewFeedbackPlaceholder')}
          minRows={4}
          value={feedback}
          onChange={(e) => setFeedback(e.currentTarget.value)}
          error={feedback.length > 0 && feedback.trim().length < 20 ? t('participations.reviewFeedbackRequired') : undefined}
        />

        {error && <Alert color="red" variant="light" radius="md">{error}</Alert>}

        <Group justify="flex-end" gap="sm">
          <Button variant="default" radius="xl" onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button
            color="eco-primary"
            radius="xl"
            leftSection={<IconStar size={16} />}
            loading={submitting}
            onClick={handleSubmit}
          >
            {submitting ? t('participations.reviewSubmitting') : t('participations.reviewSubmit')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// ─── Participation card ───────────────────────────────────────────────────────
function ParticipationCard({
  participation,
  onReview,
}: {
  participation: any;
  onReview: (participation: any) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const host = participation.host;
  const canReview = participation.status === 'ACCEPTED';
  const coverUrl = participation.project?.coverImageUrl
    ?? 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800';

  return (
    <Paper radius="lg" p={0} withBorder className="overflow-hidden flex flex-col h-full">
      {/* Cover image */}
      <Link href={`/projects/${participation.project?._id}`} className="block relative overflow-hidden" style={{ aspectRatio: '16/7' }}>
        <img src={coverUrl} alt={participation.project?.title} className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3">
          <StatusBadge status={participation.status} />
        </div>
      </Link>

      <div className="flex-1 p-4 flex flex-col gap-3">
        {/* Title */}
        <Link
          href={`/projects/${participation.project?._id}`}
          className="text-base font-display font-bold text-gray-900 hover:text-eco-primary transition-colors line-clamp-1"
        >
          {participation.project?.title}
        </Link>

        {/* Host info */}
        {host && (
          <Group gap="sm" p="sm" className="rounded-xl bg-gray-50 border border-gray-100">
            {host.publicId ? (
              <Link href={`/users/${host.publicId}`}>
                <Avatar src={host.profilePictureUrl} size="sm" radius="xl" color="eco-primary" style={{ cursor: 'pointer' }}>
                  {host.firstName?.[0]}{host.lastName?.[0]}
                </Avatar>
              </Link>
            ) : (
              <Avatar src={host.profilePictureUrl} size="sm" radius="xl" color="eco-primary">
                {host.firstName?.[0]}{host.lastName?.[0]}
              </Avatar>
            )}
            <Stack gap={1} className="flex-1 min-w-0">
              <Text size="xs" c="dimmed">{t('participations.hostedBy')}</Text>
              {host.publicId ? (
                <Link href={`/users/${host.publicId}`} className="no-underline">
                  <Text size="sm" fw={600} c="eco-primary">{host.firstName} {host.lastName}</Text>
                </Link>
              ) : (
                <Text size="sm" fw={600}>{host.firstName} {host.lastName}</Text>
              )}
            </Stack>
            {host.averageRating > 0 && (
              <Group gap={4} wrap="nowrap">
                <IconStar size={12} style={{ fill: '#facc15', color: '#facc15' }} />
                <Text size="xs" c="dimmed">{host.averageRating.toFixed(1)}</Text>
              </Group>
            )}
          </Group>
        )}

        {/* Host response */}
        {participation.hostResponseMessage && (
          <Paper radius="md" p="sm" bg="gray.0">
            <Text size="xs" fw={600} c="dimmed" mb={4}>{t('participations.hostResponse')} :</Text>
            <Text size="sm" c="dimmed" lineClamp={2}>{participation.hostResponseMessage}</Text>
          </Paper>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          <Link
            href={`/projects/${participation.project?._id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-eco-primary hover:underline"
          >
            {t('participations.viewProject')}
            <IconArrowRight size={14} />
          </Link>

          {canReview && (
            <Button
              size="xs"
              variant="light"
              color="eco-primary"
              radius="xl"
              leftSection={<IconStar size={14} />}
              onClick={() => onReview(participation)}
            >
              {t('participations.leaveReview')}
            </Button>
          )}
        </div>
      </div>
    </Paper>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MyParticipationsClient() {
  const t = useTranslations();
  const [filter, setFilter] = useState('all');
  const [reviewTarget, setReviewTarget] = useState<any | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const token = getSessionToken();
  const participations = useQuery(
    api.participations.getMyRequests,
    token ? { token } : 'skip'
  ) as any[] | undefined;

  const createReview = useMutation(api.reviews.create);

  const isLoading = participations === undefined;

  const filtered = (participations ?? []).filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const handleReviewSubmit = async (rating: number, feedback: string) => {
    if (!token || !reviewTarget?.host) return;
    await createReview({
      token,
      receiverId: reviewTarget.host._id,
      rating,
      feedback,
    });
    setReviewSuccess(true);
    setReviewTarget(null);
    setTimeout(() => setReviewSuccess(false), 4000);
  };

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <Container size="md">
          <Stack gap="lg">
            {/* Header */}
            <Group gap="md" mb="xl">
              <ThemeIcon size={48} radius="md" color="eco-primary" variant="light">
                <IconCompass size={28} />
              </ThemeIcon>
              <Stack gap={4}>
                <Title order={1} className="font-display">{t('participations.title')}</Title>
                <Text c="dimmed">{t('participations.subtitle')}</Text>
              </Stack>
            </Group>

            {reviewSuccess && (
              <Alert color="green" variant="light" radius="md" icon={<IconCircleCheck size={18} />}>
                {t('participations.reviewSuccess')}
              </Alert>
            )}

            {/* Filter tabs */}
            <div className="inline-flex w-fit items-center rounded-md bg-gray-100 p-1 gap-0.5">
              {[
                { value: 'all',      label: t('participations.all') },
                { value: 'PENDING',  label: t('participations.pending') },
                { value: 'ACCEPTED', label: t('participations.accepted') },
                { value: 'REFUSED',  label: t('participations.rejected') },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                    filter === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            {isLoading ? (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                {[1, 2, 3].map((i) => (
                  <Paper key={i} radius="lg" h={280} withBorder className="animate-pulse bg-gray-100" />
                ))}
              </SimpleGrid>
            ) : filtered.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                {filtered.map((p) => (
                  <ParticipationCard key={p._id} participation={p} onReview={setReviewTarget} />
                ))}
              </SimpleGrid>
            ) : (
              <Paper radius="lg" p="xl" withBorder className="text-center">
                <Stack align="center" gap="md">
                  <IconCompass size={64} className="text-gray-300" />
                  <Title order={3} className="font-display">{t('participations.noParticipations')}</Title>
                  <Text c="dimmed" maw={400}>{t('participations.noParticipationsDesc')}</Text>
                  <Button component={Link} href="/projects" radius="xl" size="md" color="eco-primary">
                    {t('participations.browseProjects')}
                  </Button>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Container>
      </div>

      {/* Review modal */}
      <ReviewModal
        opened={reviewTarget !== null}
        onClose={() => setReviewTarget(null)}
        host={reviewTarget?.host}
        onSubmit={handleReviewSubmit}
      />
    </Layout>
  );
}
