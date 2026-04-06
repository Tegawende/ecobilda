import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Globe, Bell, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { adminApi, type AdminNotificationSettings } from '@/services/api';

const LOCAL_STORAGE_KEY = 'admin-notification-settings';

const defaultSettings: AdminNotificationSettings = {
  notify_new_user: true,
  notify_new_project: true,
  notify_new_report: true,
  notify_new_participation: true,
};

function getLocalSettings(): AdminNotificationSettings {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return defaultSettings;
}

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminNotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getNotificationSettings();
      setSettings(data);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Fallback to localStorage
      setSettings(getLocalSettings());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('admin-language', lang);
  };

  const handleToggle = (key: keyof AdminNotificationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await adminApi.updateNotificationSettings(settings);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
      toast({
        title: t('settings.saved'),
        description: t('settings.savedDesc'),
        variant: 'success',
      });
    } catch {
      // Save to localStorage as fallback
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
      toast({
        title: t('settings.saved'),
        description: t('settings.savedDesc'),
        variant: 'success',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const notificationItems: { key: keyof AdminNotificationSettings; labelKey: string; descKey: string }[] = [
    { key: 'notify_new_user', labelKey: 'settings.notifyNewUser', descKey: 'settings.notifyNewUserDesc' },
    { key: 'notify_new_project', labelKey: 'settings.notifyNewProject', descKey: 'settings.notifyNewProjectDesc' },
    { key: 'notify_new_report', labelKey: 'settings.notifyNewReport', descKey: 'settings.notifyNewReportDesc' },
    { key: 'notify_new_participation', labelKey: 'settings.notifyNewParticipation', descKey: 'settings.notifyNewParticipationDesc' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-eco-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8" />
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Language Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t('settings.language')}
          </CardTitle>
          <CardDescription>
            {t('settings.languageDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={i18n.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="nl">Nederlands</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {t('settings.notifications')}
          </CardTitle>
          <CardDescription>
            {t('settings.notificationsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationItems.map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={() => handleToggle(item.key)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-eco-primary focus:ring-eco-primary"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{t(item.labelKey)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t(item.descKey)}</p>
              </div>
            </label>
          ))}

          <div className="pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.save')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
