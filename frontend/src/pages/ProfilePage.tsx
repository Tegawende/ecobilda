import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconStar,
  IconEdit,
  IconMapPin,
  IconMail,
  IconMessage,
  IconTools,
  IconCake,
  IconArrowLeft,
  IconLanguage,
  IconUser,
  IconCalendar,
} from '@tabler/icons-react';
import { Layout } from '../components/common/Layout';
import { mockUser, mockReviews } from '../data/mockData';
import type { Review } from '../types';

// Custom Styled Components matching DESIGN_SYSTEM.md
const Input = ({ label, error, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-bold text-gray-700 ml-1">{label}</label>}
    <input
      className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500 focus:ring-red-100' : 'border-gray-400 focus:border-black focus:ring-black/10'} focus:outline-none focus:ring-2 transition-all text-gray-900 placeholder-gray-500`}
      {...props}
    />
    {error && <span className="text-xs text-red-600 ml-1">{error}</span>}
  </div>
);

const Textarea = ({ label, error, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-bold text-gray-700 ml-1">{label}</label>}
    <textarea
      className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500 focus:ring-red-100' : 'border-gray-400 focus:border-black focus:ring-black/10'} focus:outline-none focus:ring-2 transition-all text-gray-900 placeholder-gray-500 min-h-[120px] resize-none`}
      {...props}
    />
    {error && <span className="text-xs text-red-600 ml-1">{error}</span>}
  </div>
);

// Review Card Component
function ReviewCard({ review }: { review: Review }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
      <div className="flex items-start gap-4">
        <img
          src={review.writer.profile_picture || undefined}
          alt={`${review.writer.first_name} ${review.writer.last_name}`}
          className="w-12 h-12 rounded-full object-cover border-2 border-eco-primary/20"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-900">
              {review.writer.first_name} {review.writer.last_name}
            </h4>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <IconStar
                  key={i}
                  size={16}
                  className={i < review.rating ? 'text-eco-terracotta fill-current' : 'text-gray-300'}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date(review.created_at).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-gray-700 mt-3">{review.feedback}</p>

          {review.response && (
            <div className="mt-4 pl-4 border-l-2 border-eco-primary/30 bg-eco-brand-50/30 p-3 rounded-r-lg">
              <p className="text-sm font-semibold text-eco-primary mb-1">
                {t('profile.yourResponse') || 'Your response'}
              </p>
              <p className="text-gray-600 text-sm">{review.response}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Edit Profile Form
function EditProfileForm({ user, onSave, onCancel }: { user: typeof mockUser; onSave: (data: any) => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    bio: user.bio,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-soft p-8 border border-gray-100">
      <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
        {t('profile.editProfile') || 'Edit Profile'}
      </h2>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('auth.firstName') || 'First Name'}
            value={formData.first_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, first_name: e.target.value })}
          />
          <Input
            label={t('auth.lastName') || 'Last Name'}
            value={formData.last_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, last_name: e.target.value })}
          />
        </div>

        <Textarea
          label={t('profile.bio') || 'About me'}
          value={formData.bio}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
          placeholder={t('profile.bioPlaceholder') || 'Tell others about yourself...'}
        />
      </div>

      <div className="flex justify-end gap-3 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-full border border-gray-300 text-gray-700 font-semibold hover:border-gray-400 transition-colors"
        >
          {t('common.cancel') || 'Cancel'}
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-full bg-eco-primary text-white font-semibold hover:bg-eco-primaryDark shadow-lg shadow-eco-primary/20 transition-all"
        >
          {t('common.save') || 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(mockUser);
  const reviews = mockReviews;

  const handleSave = (data: any) => {
    setUser({ ...user, ...data });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Layout>
        <div className="bg-stone-50 min-h-screen py-12">
          <div className="max-w-2xl mx-auto px-6">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-eco-primary mb-6 transition-colors"
            >
              <IconArrowLeft size={18} />
              {t('profile.backToProfile') || 'Back to Profile'}
            </button>
            <EditProfileForm user={user} onSave={handleSave} onCancel={() => setIsEditing(false)} />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-soft p-8 border border-gray-100 mb-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <img
                src={user.profile_picture || undefined}
                alt={`${user.first_name} ${user.last_name}`}
                className="w-24 h-24 rounded-full border-4 border-eco-primary/20 object-cover shadow-md"
              />

              {/* User Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-display font-bold text-gray-900">
                      {user.first_name} {user.last_name}
                    </h1>
                    <p className="text-gray-500 flex items-center gap-2 mt-1">
                      <IconMail size={16} />
                      {user.email}
                    </p>

                    {user.review_count > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-1">
                          <IconStar size={18} className="text-eco-terracotta fill-current" />
                          <span className="font-bold text-gray-900">{user.average_rating.toFixed(1)}</span>
                        </div>
                        <span className="text-gray-500 text-sm">
                          ({user.review_count} {user.review_count === 1 ? (t('profile.review') || 'review') : (t('profile.reviews') || 'reviews')})
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-200 text-gray-700 font-semibold hover:border-eco-primary hover:text-eco-primary transition-all"
                  >
                    <IconEdit size={18} />
                    {t('profile.editProfile') || 'Edit Profile'}
                  </button>
                </div>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <IconUser size={16} />
                  {t('profile.about') || 'About'}
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Location */}
              {user.address && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <IconMapPin size={16} className="text-eco-terracotta" />
                    {t('profile.location') || 'Location'}
                  </h3>
                  <p className="font-medium text-gray-900">
                    {user.address.city}, {user.address.country?.name}
                  </p>
                </div>
              )}

              {/* Date of Birth */}
              {user.date_of_birth && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <IconCake size={16} className="text-eco-terracotta" />
                    {t('profile.birthday') || 'Birthday'}
                  </h3>
                  <p className="font-medium text-gray-900">
                    {new Date(user.date_of_birth).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {/* Languages */}
              {user.languages && user.languages.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <IconLanguage size={16} className="text-eco-terracotta" />
                    {t('profile.languages') || 'Languages'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.languages.map((lang) => (
                      <span
                        key={lang.code}
                        className="px-3 py-1 rounded-full text-xs font-bold bg-eco-brand-50 text-eco-primary border border-eco-primary/20"
                      >
                        {lang.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {user.skills && user.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <IconTools size={16} className="text-eco-terracotta" />
                    {t('profile.skills') || 'Skills'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill) => (
                      <span
                        key={skill.code}
                        className="px-3 py-1 rounded-full text-xs font-bold bg-eco-brand-50 text-eco-primary border border-eco-primary/20"
                      >
                        {skill.icon} {skill.display_name_en}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
                <IconMessage size={24} className="text-eco-primary" />
                {t('profile.reviewsTitle') || 'Reviews'} ({reviews.length})
              </h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
