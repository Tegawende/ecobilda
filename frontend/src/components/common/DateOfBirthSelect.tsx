'use client';

import { useTranslations } from 'next-intl';

/** Returns max days for a given month (1-12) and year */
function getDaysInMonth(month: number, year: number): number {
  if (!month || month < 1 || month > 12) return 31;
  if (!year || year < 1900) return 31;
  return new Date(year, month, 0).getDate();
}

export interface DateOfBirthValues {
  dob_day: string;
  dob_month: string;
  dob_year: string;
}

interface DateOfBirthSelectProps {
  values: DateOfBirthValues;
  onChange: (field: keyof DateOfBirthValues, value: string) => void;
  error?: string | null;
  /** 'auth' for the auth form style (plain selects), 'profile' for Mantine style */
  variant?: 'auth' | 'profile';
}

const currentYear = new Date().getFullYear();
const maxYear = currentYear - 18;
const minYear = currentYear - 100;

const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

export function DateOfBirthSelect({ values, onChange, error, variant = 'auth' }: DateOfBirthSelectProps) {
  const t = useTranslations();
  const months: string[] = t.raw('auth.dobMonths');

  // Compute max days based on selected month/year
  const month = parseInt(values.dob_month, 10);
  const year = parseInt(values.dob_year, 10);
  const maxDays = getDaysInMonth(month || 0, year || 0);
  const dayOptions = Array.from({ length: maxDays }, (_, i) => i + 1);

  // Auto-correct day if it exceeds max days for the selected month/year
  const selectedDay = parseInt(values.dob_day, 10);
  if (values.dob_day && selectedDay > maxDays) {
    onChange('dob_day', '');
  }

  const displayError = error;

  const selectClass = (hasError: boolean) =>
    variant === 'auth'
      ? `w-full px-2 py-3 rounded-lg border ${hasError ? 'border-red-500' : 'border-gray-400'} focus:border-black focus:ring-1 focus:ring-black/10 outline-none transition-all text-gray-900 bg-white appearance-none cursor-pointer`
      : `w-full px-2 py-[9px] rounded-md border ${hasError ? 'border-red-500' : 'border-[#ced4da]'} focus:border-[#228be6] focus:ring-1 focus:ring-[#228be6]/20 outline-none transition-all text-gray-900 bg-white appearance-none cursor-pointer text-sm`;

  return (
    <div className="flex flex-col gap-1.5">
      <label className={variant === 'auth' ? 'text-xs text-gray-600 font-bold ml-1' : 'text-sm font-medium text-gray-900'}>
        {t('auth.dateOfBirth')}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {/* Day */}
        <select
          value={values.dob_day}
          onChange={(e) => onChange('dob_day', e.target.value)}
          className={selectClass(!!displayError)}
        >
          <option value="">{t('auth.dobDay')}</option>
          {dayOptions.map((d) => (
            <option key={d} value={String(d)}>{d}</option>
          ))}
        </select>

        {/* Month */}
        <select
          value={values.dob_month}
          onChange={(e) => onChange('dob_month', e.target.value)}
          className={selectClass(!!displayError)}
        >
          <option value="">{t('auth.dobMonth')}</option>
          {months.map((name, i) => (
            <option key={i + 1} value={String(i + 1)}>{name}</option>
          ))}
        </select>

        {/* Year */}
        <select
          value={values.dob_year}
          onChange={(e) => onChange('dob_year', e.target.value)}
          className={selectClass(!!displayError)}
        >
          <option value="">{t('auth.dobYear')}</option>
          {yearOptions.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
      </div>

      {displayError && (
        <div className="flex items-center gap-1 mt-1 ml-1 text-xs text-red-600">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
          <span>{displayError}</span>
        </div>
      )}

      {variant === 'auth' && (
        <p className="text-xs text-gray-500 ml-1">{t('auth.dobDesc')}</p>
      )}
    </div>
  );
}

/** Validation helper for forms */
export function validateDateOfBirth(day: string, month: string, year: string, t: (key: string) => string): string | null {
  if (!day || !month || !year) return t('auth.validation.birthDateRequired');
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (d > getDaysInMonth(m, y)) return t('auth.dobInvalidDate');
  const today = new Date();
  const birthDate = new Date(y, m - 1, d);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  const exactAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
  if (exactAge < 18) return t('auth.validation.ageRequirement');
  return null;
}
