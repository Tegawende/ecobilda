import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftSection?: React.ReactNode;
    rightSection?: React.ReactNode;
    description?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, leftSection, rightSection, description, className = '', ...props }, ref) => (
        <div className="flex flex-col gap-1.5 relative w-full">
            {label && <label className="text-sm font-bold text-gray-700 ml-1">{label}</label>}
            <div className="relative">
                {leftSection && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10">
                        {leftSection}
                    </div>
                )}
                <input
                    ref={ref}
                    className={`w-full py-3 rounded-xl border ${error
                        ? 'border-red-500 focus:ring-red-100'
                        : 'border-gray-400 focus:border-black focus:ring-black/10'
                        } focus:outline-none focus:ring-1 transition-all text-gray-900 placeholder-gray-500 shadow-sm ${leftSection ? 'pl-10' : 'px-4'} ${rightSection ? 'pr-10' : 'px-4'} ${className}`}
                    {...props}
                />
                {rightSection && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-800 font-semibold cursor-pointer select-none underline text-sm z-10">
                        {rightSection}
                    </div>
                )}
            </div>
            {description && <p className="text-xs text-gray-500 ml-1">{description}</p>}
            {error && (
                <div className="flex items-center gap-1 mt-1 ml-1 text-xs text-red-600">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}
        </div>
    )
);

Input.displayName = 'Input';
