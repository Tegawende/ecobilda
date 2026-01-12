import type { InputHTMLAttributes, ReactNode } from 'react';

export interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
    /** Label displayed above the input */
    label?: string;
    /** Error message to display below the input */
    error?: string;
    /** Helper text displayed below the input */
    description?: string;
    /** Element displayed on the right side of the input (e.g., show/hide password button) */
    rightSection?: ReactNode;
    /** Custom class name for the container */
    containerClassName?: string;
}

/**
 * A styled form input component with support for labels, errors, descriptions, and right sections.
 * Replaces inline Input components throughout the app.
 */
export function FormInput({
    label,
    error,
    description,
    rightSection,
    containerClassName = '',
    id,
    ...inputProps
}: FormInputProps) {
    // Generate an ID if not provided (for accessibility)
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
        <div className={`flex flex-col gap-1.5 relative ${containerClassName}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-bold text-gray-700 ml-1"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    id={inputId}
                    className={`w-full px-4 py-3 rounded-xl border ${error
                            ? 'border-red-500 focus:ring-red-100'
                            : 'border-gray-400 focus:border-black focus:ring-black/10'
                        } focus:outline-none focus:ring-1 transition-all text-gray-900 placeholder-gray-500`}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={
                        error ? `${inputId}-error` : description ? `${inputId}-description` : undefined
                    }
                    {...inputProps}
                />
                {rightSection && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-800 font-semibold cursor-pointer select-none underline text-sm">
                        {rightSection}
                    </div>
                )}
            </div>
            {description && (
                <p id={`${inputId}-description`} className="text-xs text-gray-500 ml-1">
                    {description}
                </p>
            )}
            {error && (
                <div
                    id={`${inputId}-error`}
                    className="flex items-center gap-1 mt-1 ml-1 text-xs text-red-600"
                    role="alert"
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="12"
                        height="12"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
