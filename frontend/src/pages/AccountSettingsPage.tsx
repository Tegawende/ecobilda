import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconSettings,
  IconBell,
  IconGlobe,
  IconLock,
  IconTrash,
  IconCheck,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react';
import { Layout } from '../components/common/Layout';
import { clearAuthTokens } from '../services/api';

// Custom Toggle Switch
const Toggle = ({ checked, onChange, label, description }: { checked: boolean; onChange: (val: boolean) => void; label: string; description?: string }) => (
  <div className="flex items-start justify-between py-3">
    <div className="flex-1 mr-4">
      <p className="font-medium text-gray-900">{label}</p>
      {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-eco-primary focus:ring-offset-2 ${checked ? 'bg-eco-primary' : 'bg-gray-200'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  </div>
);

// Custom Select Component
const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (val: string) => void; options: { value: string; label: string }[] }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-bold text-gray-700 ml-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none transition-all text-gray-900 bg-white cursor-pointer appearance-none"
      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
);

// Password Input
const PasswordInput = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (val: string) => void; placeholder?: string }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-gray-700 ml-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none transition-all text-gray-900 placeholder-gray-500"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {show ? <IconEyeOff size={20} /> : <IconEye size={20} />}
        </button>
      </div>
    </div>
  );
};

export function AccountSettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    email_notifications: true,
    project_updates: true,
    message_notifications: true,
    marketing_emails: false,
    language: 'fr',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    console.log('Saving settings:', settings);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Changing password');
    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteAccount = () => {
    if (confirm(t('settings.deleteConfirm') || 'Are you sure you want to delete your account? This action cannot be undone.')) {
      clearAuthTokens();
      localStorage.removeItem('mock_user');
      navigate('/');
    }
  };


  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-xl bg-eco-brand-50 flex items-center justify-center text-eco-primary">
              <IconSettings size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">
                {t('settings.title') || 'Account Settings'}
              </h1>
              <p className="text-gray-500 mt-1">
                {t('settings.subtitle') || 'Manage your preferences and security'}
              </p>
            </div>
          </div>

          {/* Success Toast */}
          {saveSuccess && (
            <div className="fixed top-24 right-6 bg-eco-primary text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-pulse z-50">
              <IconCheck size={20} />
              {t('settings.saved') || 'Settings saved!'}
            </div>
          )}

          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <IconBell size={24} className="text-eco-primary" />
                <h2 className="text-xl font-display font-bold text-gray-900">
                  {t('settings.notifications') || 'Notifications'}
                </h2>
              </div>

              <form onSubmit={handleSaveSettings}>
                <div className="divide-y divide-gray-100">
                  <Toggle
                    label={t('settings.emailNotifications') || 'Email Notifications'}
                    description={t('settings.emailNotificationsDesc') || 'Receive email notifications for important updates'}
                    checked={settings.email_notifications}
                    onChange={(val) => setSettings({ ...settings, email_notifications: val })}
                  />
                  <Toggle
                    label={t('settings.projectUpdates') || 'Project Updates'}
                    description={t('settings.projectUpdatesDesc') || "Get notified about projects you're interested in"}
                    checked={settings.project_updates}
                    onChange={(val) => setSettings({ ...settings, project_updates: val })}
                  />
                  <Toggle
                    label={t('settings.messageNotifications') || 'Message Notifications'}
                    description={t('settings.messageNotificationsDesc') || 'Receive notifications for new messages'}
                    checked={settings.message_notifications}
                    onChange={(val) => setSettings({ ...settings, message_notifications: val })}
                  />
                  <Toggle
                    label={t('settings.marketingEmails') || 'Marketing Emails'}
                    description={t('settings.marketingEmailsDesc') || 'Receive news and promotional content'}
                    checked={settings.marketing_emails}
                    onChange={(val) => setSettings({ ...settings, marketing_emails: val })}
                  />
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-eco-primary text-white font-semibold hover:bg-eco-primaryDark shadow-lg shadow-eco-primary/20 transition-all"
                  >
                    {t('settings.saveChanges') || 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Language */}
            <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <IconGlobe size={24} className="text-eco-primary" />
                <h2 className="text-xl font-display font-bold text-gray-900">
                  {t('settings.language') || 'Language'}
                </h2>
              </div>

              <form onSubmit={handleSaveSettings}>
                <Select
                  label={t('settings.preferredLanguage') || 'Preferred Language'}
                  value={settings.language}
                  onChange={(val) => setSettings({ ...settings, language: val })}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'fr', label: 'Français' },
                    { value: 'nl', label: 'Nederlands' },
                    { value: 'de', label: 'Deutsch' },
                  ]}
                />
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-eco-primary text-white font-semibold hover:bg-eco-primaryDark shadow-lg shadow-eco-primary/20 transition-all"
                  >
                    {t('settings.saveLanguage') || 'Save Language'}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <IconLock size={24} className="text-eco-primary" />
                <h2 className="text-xl font-display font-bold text-gray-900">
                  {t('settings.changePassword') || 'Change Password'}
                </h2>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <PasswordInput
                  label={t('settings.currentPassword') || 'Current Password'}
                  value={passwordForm.current_password}
                  onChange={(val) => setPasswordForm({ ...passwordForm, current_password: val })}
                />
                <PasswordInput
                  label={t('settings.newPassword') || 'New Password'}
                  value={passwordForm.new_password}
                  onChange={(val) => setPasswordForm({ ...passwordForm, new_password: val })}
                />
                <PasswordInput
                  label={t('settings.confirmPassword') || 'Confirm New Password'}
                  value={passwordForm.confirm_password}
                  onChange={(val) => setPasswordForm({ ...passwordForm, confirm_password: val })}
                />
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-eco-primary text-white font-semibold hover:bg-eco-primaryDark shadow-lg shadow-eco-primary/20 transition-all"
                  >
                    {t('settings.updatePassword') || 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl shadow-soft p-6 border-2 border-red-200">
              <div className="flex items-center gap-3 mb-4">
                <IconTrash size={24} className="text-red-500" />
                <h2 className="text-xl font-display font-bold text-red-600">
                  {t('settings.dangerZone') || 'Danger Zone'}
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                {t('settings.deleteWarning') || 'Once you delete your account, there is no going back. Please be certain.'}
              </p>
              <button
                onClick={handleDeleteAccount}
                className="px-6 py-2.5 rounded-full border-2 border-red-500 text-red-500 font-semibold hover:bg-red-50 transition-colors"
              >
                {t('settings.deleteAccount') || 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
