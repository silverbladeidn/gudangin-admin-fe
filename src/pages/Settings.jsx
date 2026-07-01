import React, { useState } from 'react';
import {
    Save,
    User,
    Lock,
    Bell,
    Palette,
    Globe,
    Shield,
    Eye,
    EyeOff
} from 'lucide-react';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [showPassword, setShowPassword] = useState(false);
    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        sms: true
    });
    const [theme, setTheme] = useState('light');

    const tabs = [
        { id: 'profile', name: 'Profile', icon: User },
        { id: 'security', name: 'Security', icon: Lock },
        { id: 'notifications', name: 'Notifications', icon: Bell },
        { id: 'appearance', name: 'Appearance', icon: Palette },
        { id: 'general', name: 'General', icon: Globe }
    ];

    const ProfileTab = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                            type="tel"
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
                <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-lime-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">JD</span>
                    </div>
                    <div>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                            Upload New Photo
                        </button>
                        <p className="text-sm text-gray-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const SecurityTab = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-600">Add an extra layer of security to your account</p>
                        <p className="text-sm text-gray-500 mt-1">We'll send a code to your phone when you sign in</p>
                    </div>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
                        Enable 2FA
                    </button>
                </div>
            </div>
        </div>
    );

    const NotificationsTab = () => (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
            <div className="space-y-6">
                {Object.entries({
                    email: 'Email Notifications',
                    push: 'Push Notifications',
                    sms: 'SMS Notifications'
                }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">{label}</p>
                            <p className="text-sm text-gray-500">Receive {label.toLowerCase()} for important updates</p>
                        </div>
                        <button
                            onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications[key] ? 'bg-purple-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications[key] ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const AppearanceTab = () => (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme Settings</h3>
            <div className="space-y-4">
                {[
                    { id: 'light', name: 'Light', description: 'Clean and bright interface' },
                    { id: 'dark', name: 'Dark', description: 'Easy on the eyes' },
                    { id: 'system', name: 'System', description: 'Follow system preference' }
                ].map((themeOption) => (
                    <label key={themeOption.id} className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                        <input
                            type="radio"
                            name="theme"
                            value={themeOption.id}
                            checked={theme === themeOption.id}
                            onChange={(e) => setTheme(e.target.value)}
                            className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                        />
                        <div className="ml-3">
                            <p className="font-medium text-gray-900">{themeOption.name}</p>
                            <p className="text-sm text-gray-500">{themeOption.description}</p>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );

    const GeneralTab = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Language & Region</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option>English (US)</option>
                            <option>Bahasa Indonesia</option>
                            <option>日本語</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option>Asia/Jakarta (UTC+7)</option>
                            <option>Asia/Tokyo (UTC+9)</option>
                            <option>UTC</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data & Privacy</h3>
                <div className="space-y-4">
                    <button className="w-full p-3 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        <p className="font-medium text-gray-900">Download Your Data</p>
                        <p className="text-sm text-gray-500">Get a copy of all your data</p>
                    </button>
                    <button className="w-full p-3 text-left border border-red-200 rounded-xl hover:bg-red-50 transition-colors text-red-600">
                        <p className="font-medium">Delete Account</p>
                        <p className="text-sm">Permanently delete your account and data</p>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileTab />;
            case 'security':
                return <SecurityTab />;
            case 'notifications':
                return <NotificationsTab />;
            case 'appearance':
                return <AppearanceTab />;
            case 'general':
                return <GeneralTab />;
            default:
                return <ProfileTab />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
                </div>
                <button className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-lime-400 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="lg:w-64">
                    <nav className="bg-white rounded-2xl shadow-lg p-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center px-4 py-3 mb-1 rounded-xl transition-all duration-200 ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-green-600 to-lime-400 text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-purple-600'
                                        }`}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    {tab.name}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default Settings;