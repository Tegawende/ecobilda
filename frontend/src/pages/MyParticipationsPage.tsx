import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconCompass,
  IconCalendar,
  IconMapPin,
  IconCircleCheck,
  IconClock,
  IconX,
  IconArrowRight,
} from '@tabler/icons-react';
import { Layout } from '../components/common/Layout';
import { mockParticipations, type Participation } from '../data/mockData';

// Status Badge Component
function StatusBadge({ status }: { status: Participation['status'] }) {
  const { t } = useTranslation();

  const config = {
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: IconClock,
      label: t('participations.pending') || 'Pending',
    },
    accepted: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: IconCircleCheck,
      label: t('participations.accepted') || 'Accepted',
    },
    rejected: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: IconX,
      label: t('participations.rejected') || 'Rejected',
    },
    completed: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: IconCircleCheck,
      label: t('participations.completed') || 'Completed',
    },
  };

  const { bg, text, icon: Icon, label } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${bg} ${text}`}>
      <Icon size={14} />
      {label}
    </span>
  );
}

// Participation Card Component
function ParticipationCard({ participation }: { participation: Participation }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 hover:shadow-float transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Project Image */}
      <div className="relative h-48 overflow-hidden group">
        <img
          src={participation.project.images[0]?.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}
          alt={participation.project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 z-10">
          <StatusBadge status={participation.status} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-2">
            <Link
              to={`/projects/${participation.project.id}`}
              className="text-lg font-display font-bold text-gray-900 hover:text-eco-primary transition-colors line-clamp-1"
            >
              {participation.project.title}
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
            <IconMapPin size={14} className="text-eco-terracotta" />
            <span className="truncate">{participation.project.address?.city}, {participation.project.address?.country?.name}</span>
          </div>

          <div className="flex items-center gap-2 mb-4 text-xs font-medium text-eco-primary bg-eco-primary/5 p-2 rounded-lg">
            <IconCalendar size={16} />
            <span>
              {new Date(participation.start_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              {' - '}
              {new Date(participation.end_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-2">
            <img
              src={participation.project.owner?.profile_picture || undefined}
              alt={participation.project.owner?.first_name}
              className="w-6 h-6 rounded-full object-cover border border-gray-100"
            />
            <span className="text-[10px] text-gray-500 truncate max-w-[80px]">
              {participation.project.owner?.first_name}
            </span>
          </div>

          <Link
            to={`/projects/${participation.project.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-eco-primary hover:text-eco-primaryDark"
          >
            {t('participations.viewProject') || 'Détails'}
            <IconArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Filter Tabs
function FilterTabs({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex overflow-x-auto gap-1 p-1 bg-gray-100/80 rounded-xl w-full no-scrollbar">
      <div className="flex gap-1 min-w-full">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${value === option.value
              ? 'bg-white text-eco-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MyParticipationsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  const [participations] = useState<Participation[]>(mockParticipations);
  const isLoading = false;

  const filterOptions = [
    { value: 'all', label: t('participations.all') || 'All' },
    { value: 'pending', label: t('participations.pending') || 'Pending' },
    { value: 'accepted', label: t('participations.accepted') || 'Accepted' },
    { value: 'completed', label: t('participations.completed') || 'Completed' },
  ];

  const filteredParticipations = participations.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <IconCompass size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">
                {t('participations.title') || 'My Participations'}
              </h1>
              <p className="text-gray-500 mt-1">
                {t('participations.subtitle') || 'Projects you applied to join'}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-10">
            <FilterTabs
              value={filter}
              onChange={setFilter}
              options={filterOptions}
            />
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse h-64 shadow-soft border border-gray-100" />
              ))}
            </div>
          ) : filteredParticipations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredParticipations.map((participation) => (
                <ParticipationCard key={participation.id} participation={participation} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-soft max-w-2xl mx-auto">
              <IconCompass size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
                {t('participations.noParticipations') || 'No participations yet'}
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {t('participations.noParticipationsDesc') || 'Start exploring projects and apply to join them!'}
              </p>
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-eco-primary text-white font-semibold hover:bg-eco-primaryDark shadow-lg shadow-eco-primary/20 transition-all"
              >
                {t('participations.browseProjects') || 'Browse Projects'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
