import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DatePickerInput } from '@mantine/dates';
import { Layout } from '../components/common/Layout';
import {
  IconMapPin,
  IconCalendar,
  IconUsers,
  IconClock,
  IconWifi,
  IconBabyCarriage,
  IconDog,
  IconSmoking,
  IconHome,
  IconLeaf,
  IconStar,
} from '@tabler/icons-react';
import { mockAllProjects } from '../data/mockData';
import { ProjectImageGallery } from '../components/projects/ProjectImageGallery';

export function ProjectDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const project = mockAllProjects.find(p => p.id === Number(id));
  const [dates, setDates] = useState<[Date | null, Date | null]>([null, null]);

  if (!project) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold mb-4">{t('projectDetail.notFound')}</h2>
          <Link to="/projects" className="text-eco-primary hover:underline">{t('projectDetail.backToProjects')}</Link>
        </div>
      </Layout>
    );
  }

  const isNatB = project.project_type === 'NATB';
  // Get all images as array of strings
  const projectImages = project.images && project.images.length > 0
    ? project.images.map(img => img.image)
    : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200'];

  return (
    <Layout>
      <div className="bg-white min-h-screen pb-20">
        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {/* Title and Location Header */}
          <div className="mb-6">
            <span className={`inline-flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider shadow-sm ${isNatB ? 'bg-eco-primary' : 'bg-eco-terracotta'
              }`}>
              {isNatB ? <IconHome size={14} /> : <IconLeaf size={14} />}
              {isNatB ? t('projects.naturalBuilding') : t('projects.permaculture')}
            </span>
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 mb-4">{project.title}</h1>
            <div className="flex items-center text-gray-600 text-lg">
              <IconMapPin size={22} className="mr-2" />
              {project.address?.city}, {project.address?.country?.name}
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="mb-8">
            <ProjectImageGallery images={projectImages} title={project.title} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 font-display">{t('projectDetail.about')}</h2>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {project.description}
                </p>
              </div>

              {/* Work Details */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-display">Détails du travail</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-eco-primary/10 flex items-center justify-center">
                      <IconClock size={24} className="text-eco-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Heures / jour</p>
                      <p className="text-lg font-bold text-gray-900">{project.hours_per_day}h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-eco-primary/10 flex items-center justify-center">
                      <IconCalendar size={24} className="text-eco-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Jours / semaine</p>
                      <p className="text-lg font-bold text-gray-900">{project.days_per_week}j</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-eco-primary/10 flex items-center justify-center">
                      <IconUsers size={24} className="text-eco-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Volontaires max</p>
                      <p className="text-lg font-bold text-gray-900">{project.max_helpers}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-display">Équipements & Conditions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className={`flex flex-col items-center p-4 rounded-xl border-2 ${project.internet_provided ? 'border-eco-primary bg-eco-primary/5' : 'border-gray-200 opacity-50'
                    }`}>
                    <IconWifi size={28} className={project.internet_provided ? 'text-eco-primary' : 'text-gray-400'} />
                    <span className="text-sm font-medium mt-2">WiFi</span>
                    <span className="text-xs text-gray-500">{project.internet_provided ? 'Inclus' : 'Non'}</span>
                  </div>
                  <div className={`flex flex-col items-center p-4 rounded-xl border-2 ${project.family_friendly ? 'border-eco-primary bg-eco-primary/5' : 'border-gray-200 opacity-50'
                    }`}>
                    <IconBabyCarriage size={28} className={project.family_friendly ? 'text-eco-primary' : 'text-gray-400'} />
                    <span className="text-sm font-medium mt-2">Familles</span>
                    <span className="text-xs text-gray-500">{project.family_friendly ? 'Bienvenues' : 'Non'}</span>
                  </div>
                  <div className={`flex flex-col items-center p-4 rounded-xl border-2 ${project.pets_allowed ? 'border-eco-primary bg-eco-primary/5' : 'border-gray-200 opacity-50'
                    }`}>
                    <IconDog size={28} className={project.pets_allowed ? 'text-eco-primary' : 'text-gray-400'} />
                    <span className="text-sm font-medium mt-2">Animaux</span>
                    <span className="text-xs text-gray-500">{project.pets_allowed ? 'Acceptés' : 'Non'}</span>
                  </div>
                  <div className={`flex flex-col items-center p-4 rounded-xl border-2 ${project.smoking_allowed ? 'border-eco-primary bg-eco-primary/5' : 'border-gray-200 opacity-50'
                    }`}>
                    <IconSmoking size={28} className={project.smoking_allowed ? 'text-eco-primary' : 'text-gray-400'} />
                    <span className="text-sm font-medium mt-2">Fumeur</span>
                    <span className="text-xs text-gray-500">{project.smoking_allowed ? 'Autorisé' : 'Non'}</span>
                  </div>
                </div>
              </div>

              {/* Accommodation & Food */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-display">Hébergement & Repas</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Hébergement</h3>
                    <p className="text-gray-600">{project.accommodation_details}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Repas</h3>
                    <p className="text-gray-600">{project.food_details}</p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {project.skills && project.skills.length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 font-display">Compétences</h2>
                  <div className="flex flex-wrap gap-2">
                    {project.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-eco-primary/10 text-eco-primary font-medium rounded-full text-sm"
                      >
                        {skill.display_name_fr || skill.display_name_en}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Host */}
              {project.owner && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 font-display">Votre hôte</h2>
                  <div className="flex items-center gap-4">
                    <img
                      src={project.owner.profile_picture || undefined}
                      alt={`${project.owner.first_name} ${project.owner.last_name}`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-eco-primary"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {project.owner.first_name} {project.owner.last_name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <IconStar size={16} className="text-yellow-500 mr-1" />
                        {project.owner.average_rating?.toFixed(1)} ({project.owner.review_count} avis)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-6 font-display">{t('projectDetail.details')}</h3>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="text-gray-500 text-sm">{t('projectDetail.status')}</div>
                    <span className={`font-bold ${project.is_active ? 'text-eco-primary' : 'text-gray-400'}`}>
                      {project.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="text-gray-500 text-sm">Type</div>
                    <div className="font-bold text-gray-900 flex items-center gap-1">
                      {isNatB ? <IconHome size={16} /> : <IconLeaf size={16} />}
                      {isNatB ? 'Construction' : 'Permaculture'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="text-gray-500 text-sm">{t('projectDetail.volunteers')}</div>
                    <div className="font-bold text-gray-900 flex items-center">
                      <IconUsers size={18} className="mr-2 text-gray-400" />
                      {project.max_helpers} max
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-4">
                    <div className="text-gray-500 text-sm">Localisation</div>
                    <div className="font-bold text-gray-900 flex items-center">
                      <IconMapPin size={18} className="mr-2 text-gray-400" />
                      {project.address?.city}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-gray-500 text-sm mb-2">{t('projectDetail.selectDates')}</div>
                  <DatePickerInput
                    type="range"
                    placeholder={t('projectDetail.pickDates')}
                    value={dates}
                    onChange={setDates}
                    numberOfColumns={2}
                    size="md"
                    radius="xl"
                    leftSection={<IconCalendar size={18} stroke={1.5} />}
                    styles={{
                      input: {
                        borderColor: '#e5e7eb',
                        '&:focus': {
                          borderColor: 'var(--eco-primary)',
                        }
                      }
                    }}
                  />
                </div>

                <button className="w-full bg-eco-primary hover:bg-eco-primaryDark text-white font-bold py-4 rounded-xl shadow-lg shadow-eco-primary/20 transition-all transform hover:-translate-y-1 active:translate-y-0 text-lg cursor-pointer">
                  {t('projectDetail.apply')}
                </button>
                <p className="text-center text-xs text-gray-400 mt-4">
                  {t('projectDetail.freeForMembers')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
