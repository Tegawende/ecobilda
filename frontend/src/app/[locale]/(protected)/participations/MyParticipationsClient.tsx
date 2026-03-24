'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import logger from '@/lib/logger';
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  ThemeIcon,
  Alert,
  SimpleGrid,
  Paper,
  Button,
} from '@mantine/core';
import {
  IconCompass,
  IconCalendar,
  IconCircleCheck,
  IconClock,
  IconX,
  IconArrowRight,
  IconAlertCircle,
} from '@tabler/icons-react';
import { participationsService, type ParticipationRequest } from '@/services/participations';
import { Layout } from '@/components/common/Layout';

type DisplayStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled' | 'expired';

function mapStatus(apiStatus: ParticipationRequest['status']): DisplayStatus {
  const statusMap: Record<ParticipationRequest['status'], DisplayStatus> = {
    'PENDING': 'pending',
    'ACCEPTED': 'accepted',
    'REFUSED': 'rejected',
    'CANCELLED': 'cancelled',
    'EXPIRED': 'expired',
  };
  return statusMap[apiStatus] || 'pending';
}

function StatusBadge({ status }: { status: ParticipationRequest['status'] }) {
  const t = useTranslations();
  const displayStatus = mapStatus(status);

  const config: Record<DisplayStatus, { bg: string; text: string; icon: typeof IconClock; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: IconClock, label: t('participations.pending') || 'Pending' },
    accepted: { bg: 'bg-green-100', text: 'text-green-800', icon: IconCircleCheck, label: t('participations.accepted') || 'Accepted' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: IconX, label: t('participations.rejected') || 'Rejected' },
    completed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: IconCircleCheck, label: t('participations.completed') || 'Completed' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: IconX, label: t('participations.cancelled') || 'Cancelled' },
    expired: { bg: 'bg-gray-100', text: 'text-gray-600', icon: IconClock, label: t('participations.expired') || 'Expired' },
  };

  const { bg, text, icon: Icon, label } = config[displayStatus];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${bg} ${text}`}>
      <Icon size={14} />
      {label}
    </span>
  );
}

function ParticipationCard({ participation }: { participation: ParticipationRequest }) {
  const t = useTranslations();

  return (
    <Paper radius="lg" p={0} withBorder className="hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
      <div className="relative p-5 bg-gradient-to-r from-eco-primary/5 to-eco-terracotta/5">
        <div className="absolute top-3 right-3 z-10">
          <StatusBadge status={participation.status} />
        </div>
        <Link
          href={`/projects/${participation.project.id}`}
          className="text-lg font-display font-bold text-gray-900 hover:text-eco-primary transition-colors line-clamp-2 pr-20"
        >
          {participation.project.title}
        </Link>
      </div>

      <div className="flex-1 p-5 flex flex-col">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4 text-xs font-medium text-eco-primary bg-eco-primary/5 p-2 rounded-lg">
            <IconCalendar size={16} />
            <span>
              {participation.requested_start_date ? new Date(participation.requested_start_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}
              {' - '}
              {participation.requested_end_date ? new Date(participation.requested_end_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            </span>
          </div>

          {participation.message && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">{participation.message}</p>
          )}

          {participation.host_response_message && (
            <Paper radius="md" p="sm" bg="gray.0">
              <Text size="sm" fw={600} c="dimmed">{t('participations.hostResponse') || 'Host response'}:</Text>
              <Text size="sm" c="dimmed" mt={4}>{participation.host_response_message}</Text>
            </Paper>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
          <Text size="xs" c="dimmed">
            {t('participations.host') || 'Host'}: {participation.project.owner?.first_name}
          </Text>
          <Link
            href={`/projects/${participation.project.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-eco-primary hover:text-eco-primaryDark"
          >
            {t('participations.viewProject') || 'View Project'}
            <IconArrowRight size={14} />
          </Link>
        </div>
      </div>
    </Paper>
  );
}

function FilterTabs({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex bg-gray-100/80 rounded-xl w-full p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer whitespace-nowrap text-center ${value === option.value
            ? 'bg-white text-eco-primary shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function MyParticipationsClient() {
  const t = useTranslations();
  const [filter, setFilter] = useState('all');
  const [participations, setParticipations] = useState<ParticipationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParticipations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await participationsService.getMyParticipations();
        const requestList = Array.isArray(data) ? data : ((data as any).results || []);
        setParticipations(requestList);
      } catch (err) {
        logger.error('Failed to fetch participations:', err);
        setError(t('participations.fetchError') || 'Failed to load participations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipations();
  }, [t]);

  const filterOptions = [
    { value: 'all', label: t('participations.all') || 'All' },
    { value: 'PENDING', label: t('participations.pending') || 'Pending' },
    { value: 'ACCEPTED', label: t('participations.accepted') || 'Accepted' },
    { value: 'REFUSED', label: t('participations.rejected') || 'Rejected' },
  ];

  const filteredParticipations = participations.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  return (
    <Layout>
    <div className="bg-stone-50 min-h-screen py-12">
      <Container size="lg">
        {/* Header */}
        <Group gap="md" mb="xl">
          <ThemeIcon size={48} radius="md" color="blue" variant="light">
            <IconCompass size={28} />
          </ThemeIcon>
          <Stack gap={4}>
            <Title order={1} className="font-display">
              {t('participations.title') || 'My Participations'}
            </Title>
            <Text c="dimmed">
              {t('participations.subtitle') || 'Projects you applied to join'}
            </Text>
          </Stack>
        </Group>

        {/* Filter Tabs */}
        <div className="mb-8 pb-4 border-b border-gray-100">
          <FilterTabs value={filter} onChange={setFilter} options={filterOptions} />
        </div>

        {/* Error */}
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="lg" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        )}

        {/* Content */}
        {isLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {[1, 2, 3].map((i) => (
              <Paper key={i} radius="lg" h={256} withBorder className="animate-pulse bg-gray-100" />
            ))}
          </SimpleGrid>
        ) : !error && filteredParticipations.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {filteredParticipations.map((participation) => (
              <ParticipationCard key={participation.id} participation={participation} />
            ))}
          </SimpleGrid>
        ) : (
          <Paper radius="xl" p="xl" withBorder className="text-center max-w-xl mx-auto">
            <Stack align="center" gap="md">
              <IconCompass size={64} className="text-gray-300" />
              <Title order={3} className="font-display">
                {t('participations.noParticipations') || 'No participations yet'}
              </Title>
              <Text c="dimmed" maw={400}>
                {t('participations.noParticipationsDesc') || 'Start exploring projects and apply to join them!'}
              </Text>
              <Button
                component={Link}
                href="/projects"
                radius="xl"
                size="md"
                color="eco-primary"
              >
                {t('participations.browseProjects') || 'Browse Projects'}
              </Button>
            </Stack>
          </Paper>
        )}
      </Container>
    </div>
    </Layout>
  );
}
