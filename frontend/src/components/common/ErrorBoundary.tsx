import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { IconAlertTriangle, IconRefresh, IconHome } from '@tabler/icons-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });

        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // TODO: Log to error reporting service (e.g., Sentry) in production
        // if (import.meta.env.PROD) {
        //   logErrorToService(error, errorInfo);
        // }
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = (): void => {
        window.location.href = '/';
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-eco-cream flex items-center justify-center px-6">
                    <div className="max-w-md w-full text-center">
                        {/* Error Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                            <IconAlertTriangle size={40} className="text-red-500" strokeWidth={1.5} />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-display font-bold text-gray-900 mb-3">
                            Oups ! Quelque chose s'est mal passé
                        </h1>

                        <p className="text-gray-600 mb-6">
                            Une erreur inattendue s'est produite. Nous nous excusons pour la gêne occasionnée.
                        </p>

                        {/* Error details in development */}
                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 rounded-lg text-left overflow-auto max-h-48">
                                <p className="text-xs font-mono text-red-700 break-words">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="text-xs font-mono text-red-600 mt-2 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-eco-primary text-white font-semibold hover:bg-eco-primaryDark transition-all"
                            >
                                <IconRefresh size={18} />
                                Réessayer
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:border-eco-primary hover:text-eco-primary transition-all"
                            >
                                <IconHome size={18} />
                                Retour à l'accueil
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
