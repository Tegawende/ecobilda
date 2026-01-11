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
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 hover:shadow-float transition-all duration-300 overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Project Image */}
        <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0">
          <img
            src={participation.project.images[0]?.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}
            alt={participation.project.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Link
                  to={`/projects/${participation.project.id}`}
                  className="text-lg font-display font-bold text-gray-900 hover:text-eco-primary transition-colors line-clamp-1"
                >
                  {participation.project.title}
                </Link>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <IconMapPin size={14} className="text-eco-terracotta" />
                    {participation.project.address?.city}, {participation.project.address?.country?.name}
                  </span>
                </div>
              </div>
              <StatusBadge status={participation.status} />
            </div>

            <div className="flex items-center gap-2 mt-4 text-sm">
              <IconCalendar size={16} className="text-eco-primary" />
              <span className="text-gray-700">
                {new Date(participation.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' → '}
                {new Date(participation.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            {/* Host Info */}
            <div className="flex items-center gap-2">
              <img
                src={participation.project.owner?.profile_picture || undefined}
                alt={`${participation.project.owner?.first_name} ${participation.project.owner?.last_name}`}
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
              />
              <span className="text-sm text-gray-600">
                {t('participations.hostedBy') || 'Hosted by'}{' '}
                <span className="font-medium text-gray-900">
                  {participation.project.owner?.first_name}
                </span>
              </span>
            </div>

            <Link
              to={`/projects/${participation.project.id}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-eco-primary hover:text-eco-primaryDark transition-colors group"
            >
              {t('participations.viewProject') || 'View Project'}
              <IconArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Filter Tabs
function FilterTabs({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${value === option.value
              ? 'bg-white text-eco-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          {option.label}
        </button>
      ))}
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
          <div className="flex items-center gap-4 mb-6">
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
          <div className="mb-8">
            <FilterTabs
              value={filter}
              onChange={setFilter}
              options={filterOptions}
            />
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse h-32" />
              ))}
            </div>
          ) : filteredParticipations.length > 0 ? (
            <div className="space-y-4">
              {filteredParticipations.map((participation) => (
                <ParticipationCard key={participation.id} participation={participation} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-soft">
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
