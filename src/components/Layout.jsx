import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    BarChart3,
    Package,
    Users,
    Archive,
    Search,
    Mail,
    ListChecks,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    LogOut,
    ChevronDown,
    Home,
    Check
} from 'lucide-react';
import SemutImage from "../assets/Goodong.png";
import axios from 'axios';

const Layout = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userPermissions, setUserPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarMin, setSidebarMin] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setUserDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchAuthenticatedUser = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const userId = localStorage.getItem('user_id');

            if (!token || !userId) {
                navigate('/');
                return;
            }

            console.log('Fetching user data for ID:', userId);

            // 1. Get user basic info
            const userResponse = await axios.get(`http://127.0.0.1:8000/api/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Accept': 'application/json'
                },
            });

            console.log('User API Response:', userResponse.data);
            const userData = userResponse.data.data || userResponse.data;
            setUser(userData);

            // 2. Get user permissions - menggunakan endpoint yang sesuai
            let permissions = [];

            try {
                // Coba endpoint yang lebih sederhana
                const permResponse = await axios.get(`http://127.0.0.1:8000/api/users/${userId}/permissions`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                console.log('Permissions API Response:', permResponse.data);

                // Handle response format
                if (permResponse.data.data && Array.isArray(permResponse.data.data)) {
                    permissions = permResponse.data.data.map(perm =>
                        typeof perm === 'string' ? perm : perm.name
                    );
                } else if (permResponse.data.permissions && Array.isArray(permResponse.data.permissions)) {
                    permissions = permResponse.data.permissions;
                } else if (Array.isArray(permResponse.data)) {
                    permissions = permResponse.data.map(perm =>
                        typeof perm === 'string' ? perm : perm.name
                    );
                } else {
                    console.warn('Unexpected permissions format, using role-based defaults');
                    permissions = getDefaultPermissionsByRole(userData.role);
                }

            } catch (permError) {
                console.warn('Permissions endpoint failed, using role-based defaults:', permError);
                permissions = getDefaultPermissionsByRole(userData.role);
            }

            console.log('Final permissions:', permissions);
            setUserPermissions(permissions);
            setError(null);

        } catch (err) {
            console.error('Auth error details:', err);
            if (err.response?.status === 401) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_id');
                navigate('/');
            } else {
                // Jika error karena table not found, gunakan default permissions
                if (err.response?.data?.message?.includes('table') && err.response?.data?.message?.includes('not found')) {
                    console.log('Table error detected, using default permissions');
                    const userData = { role: user?.role || 'User' };
                    setUserPermissions(getDefaultPermissionsByRole(userData.role));
                    setError(null);
                } else {
                    setError(err.response?.data?.message || 'Failed to fetch user data');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // Helper function untuk default permissions berdasarkan role
    const getDefaultPermissionsByRole = (role) => {
        switch (role) {
            case 'Superadmin':
                return ['view_dashboard', 'view_inventory', 'create_inventory', 'edit_inventory', 'delete_inventory', 'view_stocknote', 'view_approvalnote', 'view_users', 'create_users', 'edit_users', 'delete_users', 'view_email_settings', 'edit_email_settings'];
            case 'Admin':
                return ['view_dashboard', 'view_inventory', 'create_inventory', 'edit_inventory', 'delete_inventory', 'view_approvalnote'];
            case 'User':
                return ['view_homeuser', 'view_inventaris', 'create_inventaris', 'view_requestnote'];
            default:
                return ['view_dashboard']; // minimal permission
        }
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            await axios.post('http://127.0.0.1:8000/api/logout', {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user');
            navigate('/');
        }
    };

    useEffect(() => {
        fetchAuthenticatedUser();
    }, []);

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    };

    // Permission check function
    const hasPermission = (permission) => {
        // Superadmin always has all permissions
        if (user?.role === 'Superadmin') return true;
        return userPermissions.includes(permission);
    };

    // Role check function
    const hasRole = (requiredRoles) => {
        if (!user || !user.role) return false;
        return requiredRoles.includes(user.role);
    };

    // Define navigation items berdasarkan struktur permissions yang ada
    const getAllNavigationItems = () => [
        // Menu untuk Superadmin dan Admin (Management)
        {
            name: 'Beranda',
            href: '/home',
            icon: BarChart3,
            requiredPermissions: ['view_dashboard'],
            roles: ['Superadmin', 'Admin'] // All roles have view_dashboard
        },
        {
            name: 'Inventori',
            href: '/inventory',
            icon: Package,
            requiredPermissions: ['view_inventory'],
            roles: ['Superadmin', 'Admin']
        },
        {
            name: 'Catatan Stok',
            href: '/stocknote',
            icon: Archive,
            requiredPermissions: ['view_stocknote'],
            roles: ['Superadmin']
        },
        {
            name: 'Pengguna',
            href: '/users',
            icon: Users,
            requiredPermissions: ['view_users'],
            roles: ['Superadmin']
        },
        {
            name: 'Atur Email',
            href: '/emailchange',
            icon: Mail,
            requiredPermissions: ['view_email_settings'],
            roles: ['Superadmin']
        },
        {
            name: 'Persetujuan',
            href: '/approvalnote',
            icon: ListChecks,
            requiredPermissions: ['view_approvalnote'],
            roles: ['Superadmin', 'Admin']
        },

        // Menu untuk User (End User)
        {
            name: 'Beranda',
            href: '/homeuser',
            icon: Home,
            requiredPermissions: ['view_homeuser'],
            roles: ['User']
        },
        {
            name: 'Inventaris Saya',
            href: '/inventaris',
            icon: Package,
            requiredPermissions: ['view_inventaris'],
            roles: ['User']
        },
        {
            name: 'Riwayat Permintaan',
            href: '/requestnote',
            icon: Archive,
            requiredPermissions: ['view_requestnote'],
            roles: ['User']
        }
    ];

    // Filter navigation based on role and permissions
    const getFilteredNavigation = () => {
        const allItems = getAllNavigationItems();

        if (!user) return [];

        const userRole = user.role;
        console.log('=== NAVIGATION FILTERING ===');
        console.log('User Role:', userRole);
        console.log('User Permissions:', userPermissions);

        const filtered = allItems.filter(item => {
            // Check role compatibility
            const roleMatch = hasRole(item.roles);

            // Check permission compatibility  
            const permissionMatch = item.requiredPermissions.some(perm =>
                hasPermission(perm)
            );

            console.log(`Item: ${item.name}, Role Match: ${roleMatch}, Permission Match: ${permissionMatch}`);

            // Item ditampilkan jika memenuhi kedua kondisi
            return roleMatch && permissionMatch;
        });

        console.log('Filtered Navigation:', filtered.map(item => item.name));
        return filtered;
    };

    const isActive = (path) => location.pathname === path;

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-green-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading application...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-green-50">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h3 className="text-red-800 font-medium">Authentication Error</h3>
                        <p className="text-red-600 mt-2">{error}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const filteredNavigation = getFilteredNavigation();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-green-50">
            {/* Mobile backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="flex">
                {/* Sidebar */}
                <aside className={`
                    fixed inset-y-0 left-0 z-50 
                    ${sidebarMin ? 'w-20' : 'w-72'} 
                    bg-green-500
                    transform transition-all duration-300 ease-in-out
                    lg:translate-x-0 lg:static lg:inset-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    {/* Logo and Brand */}
                    <div className={`h-16 px-4 flex items-center border-b border-green-600 bg-green-600 ${sidebarMin ? 'justify-center' : 'justify-between'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-15 h-15 flex items-center justify-center">
                                <img
                                    src={SemutImage}
                                    alt="Semut Semut"
                                    className="h-12 w-12 object-contain"
                                />
                            </div>
                            {!sidebarMin && (
                                <h1 className="text-xl font-bold text-white">
                                    Goodong
                                </h1>
                            )}
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className={`p-4 space-y-2 ${sidebarMin ? 'flex flex-col items-center' : ''}`}>
                        {filteredNavigation.length > 0 ? (
                            filteredNavigation.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-3 py-3 rounded-lg
                                            transition-all duration-200
                                            ${active
                                                ? 'bg-orange-500 text-white shadow-md'
                                                : 'text-white hover:bg-green-600'
                                            }
                                            ${sidebarMin ? 'justify-center px-2' : ''}
                                        `}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                        {!sidebarMin && (
                                            <span className="font-medium">{item.name}</span>
                                        )}
                                    </Link>
                                );
                            })
                        ) : (
                            !sidebarMin && (
                                <div className="text-center p-4 text-white/70">
                                    <p className="text-sm">No menu items available for your role</p>
                                    <p className="text-xs mt-1">Contact administrator</p>
                                </div>
                            )
                        )}
                    </nav>

                    {/* User Profile in Sidebar */}
                    {!sidebarMin && user && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-600 bg-green-600">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">
                                        {getInitials(user.name)}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold text-white truncate">
                                        {user.name}
                                    </h3>
                                    <p className="text-xs text-green-100 truncate">
                                        {user.email}
                                    </p>
                                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${user.role === 'Superadmin'
                                        ? 'bg-purple-500 text-white'
                                        : user.role === 'Admin'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-500 text-white'
                                        }`}>
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 min-h-screen flex flex-col">
                    {/* Header */}
                    <header className="sticky top-0 z-30 bg-green-600/90 backdrop-blur-md border-b border-green-700">
                        <div className="h-16 px-4 lg:px-6 flex items-center justify-between">
                            {/* Menu Toggle */}
                            <button
                                onClick={() => {
                                    if (window.innerWidth < 1024) {
                                        setSidebarOpen(!sidebarOpen);
                                    } else {
                                        setSidebarMin(!sidebarMin);
                                    }
                                }}
                                className="p-2 rounded-lg hover:bg-green-500 transition-colors"
                            >
                                {window.innerWidth < 1024 ? (
                                    <Menu className="w-5 h-5 text-white" />
                                ) : sidebarMin ? (
                                    <ChevronRight className="w-5 h-5 text-white" />
                                ) : (
                                    <ChevronLeft className="w-5 h-5 text-white" />
                                )}
                            </button>

                            {/* Right Side Actions */}
                            <div className="flex items-center gap-4">
                                {user && (
                                    <div className="relative" ref={dropdownRef}>
                                        <button
                                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-500 transition-colors"
                                        >
                                            <div className="hidden lg:block text-right">
                                                <p className="text-sm font-medium text-white">{user.name}</p>
                                                <p className="text-xs text-green-100">{user.role}</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                                                <span className="text-white font-medium text-sm">
                                                    {getInitials(user.name)}
                                                </span>
                                            </div>
                                            <ChevronDown
                                                className={`w-4 h-4 text-white transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''
                                                    }`}
                                            />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {userDropdownOpen && (
                                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                                <div className="px-4 py-3 border-b border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                                                            <span className="text-white font-medium">
                                                                {getInitials(user.name)}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {user.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{user.email}</p>
                                                            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${user.role === 'Superadmin'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : user.role === 'Admin'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {user.role}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="py-1">
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Logout
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 p-4 lg:p-6">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Layout;