import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    IconFolder,
    IconHeart,
    IconCompass,
    IconMessage,
    IconBell,
    IconSettings,
    IconMapPin,
    IconCalendar,
    IconArrowRight,
    IconStar,
    IconPlus,
} from '@tabler/icons-react';
import { Layout } from '../components/common/Layout';
import {
    mockUser,
    mockUserProjects,
    mockNotifications,
    mockConversations,
} from '../data/mockData';

export function DashboardPage() {
    const { t } = useTranslation();

    const unreadMessages = mockConversations.reduce(
        (acc, c) => acc + (c.user1.id === mockUser.id ? c.unread_count_user1 : c.unread_count_user2),
        0
    );
    const unreadNotifications = mockNotifications.filter(n => !n.is_read).length;

    return (
        <Layout>
            <div className="bg-stone-50 min-h-screen">
                {/* Welcome Section */}
                <div className="bg-gradient-to-br from-eco-primary to-eco-primaryDark py-12 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-6">
                            <img
                                src={mockUser.profile_picture || undefined}
                                alt={`${mockUser.first_name} ${mockUser.last_name}`}
                                className="w-20 h-20 rounded-full border-4 border-white/30 shadow-lg object-cover"
                            />
                            <div className="text-white">
                                <h1 className="text-3xl sm:text-4xl font-display font-bold">
                                    {t('dashboard.welcome', { name: mockUser.first_name }) || `Welcome back, ${mockUser.first_name}!`}
                                </h1>
                                <p className="mt-2 text-white/80 flex items-center gap-2">
                                    <IconMapPin size={18} />
                                    {mockUser.address?.city}, {mockUser.address?.country?.name}
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-white">
                                <div className="text-3xl font-bold">{mockUserProjects.length}</div>
                                <div className="text-white/80 text-sm">{t('dashboard.stats.projects') || 'My Projects'}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-white">
                                <div className="flex items-center gap-1">
                                    <IconStar size={24} fill="currentColor" />
                                    <span className="text-3xl font-bold">{mockUser.average_rating}</span>
                                </div>
                                <div className="text-white/80 text-sm">{t('dashboard.stats.rating') || 'Rating'}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-white">
                                <div className="text-3xl font-bold">{mockUser.review_count}</div>
                                <div className="text-white/80 text-sm">{t('dashboard.stats.reviews') || 'Reviews'}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-white">
                                <div className="text-3xl font-bold">{unreadMessages}</div>
                                <div className="text-white/80 text-sm">{t('dashboard.stats.messages') || 'New Messages'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-12">
                    {/* Quick Actions */}
                    <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
                        {t('dashboard.quickActions') || 'Quick Actions'}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <Link
                            to="/projects"
                            className="bg-white rounded-2xl shadow-soft hover:shadow-float transition-all duration-300 p-6 border border-gray-100 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-eco-brand-50 flex items-center justify-center text-eco-primary group-hover:scale-110 transition-transform">
                                    <IconCompass size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{t('dashboard.actions.browse') || 'Browse Projects'}</h3>
                                    <p className="text-sm text-gray-500">{t('dashboard.actions.browseDesc') || 'Find new opportunities'}</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            to="/my-projects"
                            className="bg-white rounded-2xl shadow-soft hover:shadow-float transition-all duration-300 p-6 border border-gray-100 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-eco-brand-50 flex items-center justify-center text-eco-primary group-hover:scale-110 transition-transform">
                                    <IconFolder size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{t('dashboard.actions.myProjects') || 'My Projects'}</h3>
                                    <p className="text-sm text-gray-500">{t('dashboard.actions.myProjectsDesc') || 'Manage your listings'}</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            to="/messages"
                            className="bg-white rounded-2xl shadow-soft hover:shadow-float transition-all duration-300 p-6 border border-gray-100 group relative"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-eco-brand-50 flex items-center justify-center text-eco-primary group-hover:scale-110 transition-transform relative">
                                    <IconMessage size={24} />
                                    {unreadMessages > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-eco-terracotta text-white text-xs font-bold rounded-full flex items-center justify-center">
                                            {unreadMessages}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{t('dashboard.actions.messages') || 'Messages'}</h3>
                                    <p className="text-sm text-gray-500">{t('dashboard.actions.messagesDesc') || 'Chat with the community'}</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            to="/projects/new"
                            className="bg-eco-primary rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 p-6 group"
                        >
                            <div className="flex items-center gap-4 text-white">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <IconPlus size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold">{t('dashboard.actions.create') || 'Create Project'}</h3>
                                    <p className="text-sm text-white/80">{t('dashboard.actions.createDesc') || 'Start something new'}</p>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* My Projects Preview */}
                    <div className="mb-12">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-display font-bold text-gray-900">
                                {t('dashboard.myProjects') || 'My Projects'}
                            </h2>
                            <Link
                                to="/my-projects"
                                className="text-eco-primary font-semibold hover:text-eco-primaryDark flex items-center gap-1 group"
                            >
                                {t('dashboard.viewAll') || 'View All'}
                                <IconArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {mockUserProjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {mockUserProjects.slice(0, 3).map((project) => (
                                    <Link
                                        key={project.id}
                                        to={`/projects/${project.id}`}
                                        className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-float transition-all duration-300 border border-gray-100 group"
                                    >
                                        <div className="h-40 overflow-hidden relative">
                                            <img
                                                src={project.images[0]?.image}
                                                alt={project.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-3 right-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${project.is_active ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'}`}>
                                                    {project.is_active ? (t('common.active') || 'Active') : (t('common.inactive') || 'Inactive')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-eco-primary transition-colors mb-2 font-display">
                                                {project.title}
                                            </h3>
                                            <div className="flex items-center text-gray-500 text-sm mb-3">
                                                <IconMapPin size={14} className="mr-1 text-eco-terracotta" />
                                                <span>{project.address?.city}, {project.address?.country?.name}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">
                                                    {project.max_helpers} {t('dashboard.helpers') || 'helpers max'}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${project.project_type === 'NATB' ? 'bg-eco-brand-50 text-eco-primary' : 'bg-amber-50 text-amber-700'}`}>
                                                    {project.project_type === 'NATB' ? t('projects.naturalBuilding') : t('projects.permaculture')}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-soft">
                                <IconFolder size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('dashboard.noProjects') || 'No projects yet'}</h3>
                                <p className="text-gray-500 mb-6">{t('dashboard.noProjectsDesc') || 'Create your first project to get started'}</p>
                                <Link
                                    to="/projects/new"
                                    className="inline-flex items-center gap-2 rounded-full bg-eco-primary text-white px-6 py-3 font-semibold hover:bg-eco-primaryDark transition-colors"
                                >
                                    <IconPlus size={18} />
                                    {t('dashboard.createFirst') || 'Create Project'}
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Notifications */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-display font-bold text-gray-900 flex items-center gap-2">
                                    <IconBell size={20} className="text-eco-terracotta" />
                                    {t('dashboard.notifications') || 'Notifications'}
                                    {unreadNotifications > 0 && (
                                        <span className="bg-eco-terracotta text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            {unreadNotifications}
                                        </span>
                                    )}
                                </h2>
                            </div>

                            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 divide-y divide-gray-100">
                                {mockNotifications.slice(0, 4).map((notification) => (
                                    <Link
                                        key={notification.id}
                                        to={notification.link_url}
                                        className={`block p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-eco-brand-50/30' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.is_read ? 'bg-eco-primary' : 'bg-transparent'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5 truncate">{notification.message}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(notification.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h2 className="text-xl font-display font-bold text-gray-900 mb-4">
                                {t('dashboard.quickLinks') || 'Quick Links'}
                            </h2>

                            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 divide-y divide-gray-100">
                                <Link to="/profile" className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
                                    <div className="w-10 h-10 rounded-lg bg-eco-brand-50 flex items-center justify-center text-eco-primary">
                                        <img
                                            src={mockUser.profile_picture || undefined}
                                            alt=""
                                            className="w-10 h-10 rounded-lg object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 group-hover:text-eco-primary transition-colors">
                                            {t('dashboard.links.profile') || 'My Profile'}
                                        </p>
                                        <p className="text-sm text-gray-500">{t('dashboard.links.profileDesc') || 'View and edit your profile'}</p>
                                    </div>
                                    <IconArrowRight size={18} className="text-gray-400 group-hover:text-eco-primary group-hover:translate-x-1 transition-all" />
                                </Link>

                                <Link to="/favorites" className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
                                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-eco-terracotta">
                                        <IconHeart size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 group-hover:text-eco-primary transition-colors">
                                            {t('dashboard.links.favorites') || 'My Favorites'}
                                        </p>
                                        <p className="text-sm text-gray-500">{t('dashboard.links.favoritesDesc') || 'Projects you saved'}</p>
                                    </div>
                                    <IconArrowRight size={18} className="text-gray-400 group-hover:text-eco-primary group-hover:translate-x-1 transition-all" />
                                </Link>

                                <Link to="/participations" className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <IconCalendar size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 group-hover:text-eco-primary transition-colors">
                                            {t('dashboard.links.participations') || 'My Participations'}
                                        </p>
                                        <p className="text-sm text-gray-500">{t('dashboard.links.participationsDesc') || 'Projects you joined'}</p>
                                    </div>
                                    <IconArrowRight size={18} className="text-gray-400 group-hover:text-eco-primary group-hover:translate-x-1 transition-all" />
                                </Link>

                                <Link to="/settings" className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                                        <IconSettings size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 group-hover:text-eco-primary transition-colors">
                                            {t('dashboard.links.settings') || 'Account Settings'}
                                        </p>
                                        <p className="text-sm text-gray-500">{t('dashboard.links.settingsDesc') || 'Manage your account'}</p>
                                    </div>
                                    <IconArrowRight size={18} className="text-gray-400 group-hover:text-eco-primary group-hover:translate-x-1 transition-all" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
