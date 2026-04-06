'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import {
  Container, Title, Text, Group, Stack, ThemeIcon, Alert, SimpleGrid,
  Paper, Button, Avatar, Modal, Textarea, Badge,
} from '@mantine/core';
import {
  IconCompass, IconCircleCheck, IconClock, IconX,
  IconStar, IconUser, IconMapPin, IconHome2, IconLeaf,
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

  const host = participation.host;
  const canReview = participation.status === 'ACCEPTED';
  const coverUrl = participation.project?.coverImageUrl
    ?? 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800';
  const isNatB = participation.project?.projectType === 'NATB';
  const address = participation.project?.address;

  return (
    <div className="group cursor-pointer">
      {/* Image — compact 16:9 */}
      <Link href={`/projects/${participation.project?._id}`} className="block">
        <div className="relative rounded-xl overflow-hidden aspect-[16/9] mb-2 bg-gray-100">
          <img
            src={coverUrl}
            alt={participation.project?.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Type badge on image */}
          <div className="absolute top-2 right-2 z-10">
            <Badge
              size="xs"
              radius="xl"
              variant="filled"
              color={isNatB ? 'eco-primary' : 'eco-terracotta'}
              leftSection={isNatB ? <IconHome2 size={10} /> : <IconLeaf size={10} />}
              tt="uppercase"
              fw={700}
              styles={{ root: { letterSpacing: '0.05em', fontSize: '0.6rem' } }}
            >
              {isNatB ? t('projects.naturalBuilding') : t('projects.permaculture')}
            </Badge>
          </div>
        </div>
      </Link>

      {/* Content */}
      <Stack gap={2} px={2}>
        <Link href={`/projects/${participation.project?._id}`} className="no-underline">
          <Text fw={700} size="sm" c="dark" className="group-hover:text-eco-primary transition-colors line-clamp-1">
            {participation.project?.title}
          </Text>
        </Link>

        {address?.city && (
          <Group gap={4} wrap="nowrap">
            <IconMapPin size={12} className="text-gray-400 flex-shrink-0" />
            <Text size="xs" c="dimmed" className="truncate">
              {[address.city, address.country?.name].filter(Boolean).join(', ')}
            </Text>
          </Group>
        )}

        {host && (
          <Group gap="xs" justify="space-between" pt={2}>
            <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
              <Avatar src={host.profilePictureUrl} size={22} radius="xl" color="eco-primary">
                {host.firstName?.[0]}
              </Avatar>
              <Text size="xs" c="dimmed" className="truncate">
                {host.firstName}
              </Text>
              {host.averageRating > 0 && (
                <Group gap={2} wrap="nowrap">
                  <IconStar size={11} style={{ fill: '#facc15', color: '#facc15' }} />
                  <Text size="xs" c="dimmed">{host.averageRating.toFixed(1)}</Text>
                </Group>
              )}
            </Group>
            {canReview && (
              <Button
                size="compact-xs"
                variant="light"
                color="eco-primary"
                radius="xl"
                leftSection={<IconStar size={12} />}
                onClick={() => onReview(participation)}
                style={{ flexShrink: 0 }}
              >
                {t('participations.leaveReview')}
              </Button>
            )}
          </Group>
        )}
      </Stack>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MyParticipationsClient() {
  const t = useTranslations();
  const [filter, setFilter] = useState('PENDING');
  const [reviewTarget, setReviewTarget] = useState<any | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const token = getSessionToken();
  const participations = useQuery(
    api.participations.getMyRequests,
    token ? { token } : 'skip'
  ) as any[] | undefined;

  const createReview = useMutation(api.reviews.create);

  const isLoading = participations === undefined;

  const filtered = (participations ?? []).filter((p) => p.status === filter);

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

            {/* Filter tabs — full width */}
            <div className="flex w-full items-center rounded-lg bg-gray-100 p-1 gap-0.5">
              {[
                { value: 'PENDING',  label: t('participations.pending') },
                { value: 'ACCEPTED', label: t('participations.accepted') },
                { value: 'REFUSED',  label: t('participations.rejected') },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                    filter === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            {isLoading ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Stack key={i} gap="xs">
                    <Paper radius="xl" h={0} style={{ aspectRatio: '4/3', paddingBottom: '75%' }} className="animate-pulse bg-gray-100" />
                    <Paper h={16} w="70%" radius="sm" className="animate-pulse bg-gray-100" />
                    <Paper h={14} w="50%" radius="sm" className="animate-pulse bg-gray-100" />
                  </Stack>
                ))}
              </SimpleGrid>
            ) : filtered.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
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
