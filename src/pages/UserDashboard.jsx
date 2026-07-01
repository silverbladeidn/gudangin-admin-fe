import React, { useState, useEffect } from 'react';
import StatCard from '../components/UserDashboard/UserStatCard';
import LowStockAlert from '../components/UserDashboard/LowStockAlert';
import FavoriteItems from '../components/UserDashboard/FavoriteItems';
import PopularProducts from '../components/UserDashboard/PopularProducts';
import RecentActivities from '../components/UserDashboard/RecentActivities';
import RequestModal from '../components/UserDashboard/RequestModal';
import {
    Search,
    Package,
    Send,
    Clock,
    CheckCircle,
    AlertTriangle,
    X,
    Plus,
    Star,
    TrendingUp,
    Calendar,
    User,
    Activity,
    ShoppingCart,
    Heart,
    Zap,
    ArrowRight,
    RefreshCw,
    AlertCircle,
    Minus,
    Users,
    BarChart3
} from 'lucide-react';
import axios from 'axios';

// ==== Axios Config ====
axios.defaults.baseURL = 'http://127.0.0.1:8000';
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Accept'] = 'application/json';
    return config;
});
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

const UserDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestQuantity, setRequestQuantity] = useState(1);
    const [requestNote, setRequestNote] = useState('');

    const [stats, setStats] = useState({
        totalItems: 0,
        availableItems: 0,
        lowStock: 0,
        outOfStock: 0,
        pendingRequests: 3,
        approvedRequests: 12
    });

    const [products, setProducts] = useState([]);
    const [favoriteItems, setFavoriteItems] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);

    // Tambahan state agar tidak error
    const [popularProducts, setPopularProducts] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const productsResponse = await axios.get('/api/products');
            const productsData = productsResponse.data?.data || productsResponse.data || [];
            setProducts(productsData);

            // ✅ Gunakan image_url dari API
            const favoriteData = productsData.slice(0, 4).map((item, index) => ({
                ...item,
                image_url: item.image_url
                    ? item.image_url
                    : '/images/placeholder.jpg',   // fallback bila null
                usage_frequency: 45 - index * 5,
                last_requested: new Date(
                    Date.now() - index * 24 * 60 * 60 * 1000
                ).toISOString().split('T')[0]
            }));
            setFavoriteItems(favoriteData);

            const lowStockData = productsData
                .filter(
                    item => item.status === 'low_stock' || item.stock_quantity < 10
                )
                .map(item => ({
                    ...item,
                    min_stock: 10,
                    category: 'Alat Tulis'
                }));
            setLowStockItems(lowStockData);

            const totalProducts = productsData.length;
            const inStock = productsData.filter(p => p.status === 'in_stock').length;
            const lowStock = productsData.filter(p => p.status === 'low_stock').length;
            const outOfStock = productsData.filter(p => p.status === 'out_of_stock').length;

            setStats({
                totalItems: totalProducts,
                availableItems: inStock,
                lowStock,
                outOfStock,
                pendingRequests: 3,
                approvedRequests: 12
            });

            setPopularProducts([
                { name: 'Pulpen', requests: 25, growth: '+12%' },
                { name: 'Buku Catatan', requests: 20, growth: '+9%' },
                { name: 'Stapler', requests: 15, growth: '+7%' }
            ]);

            setRecentActivities([
                {
                    id: 1,
                    message: 'Request Buku Catatan disetujui',
                    icon: CheckCircle,
                    color: 'text-green-600',
                    timestamp: new Date()
                },
                {
                    id: 2,
                    message: 'Request Pulpen diajukan',
                    icon: Send,
                    color: 'text-blue-600',
                    timestamp: new Date(Date.now() - 600000)
                },
                {
                    id: 3,
                    message: 'Stok Stapler menipis',
                    icon: AlertTriangle,
                    color: 'text-yellow-600',
                    timestamp: new Date(Date.now() - 3600000)
                }
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchData();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now - time) / (1000 * 60));
        if (diff < 1) return 'Baru saja';
        if (diff < 60) return `${diff} menit lalu`;
        if (diff < 1440) return `${Math.floor(diff / 60)} jam lalu`;
        return `${Math.floor(diff / 1440)} hari lalu`;
    };

    const handleQuickRequest = (item) => {
        setSelectedItem(item);
        setRequestQuantity(1);
        setRequestNote('');
        setShowRequestModal(true);
    };

    const submitRequest = async () => {
        try {
            await new Promise(res => setTimeout(res, 800));
            alert('Request berhasil dikirim!');
            setShowRequestModal(false);
            setSelectedItem(null);
            setStats(prev => ({ ...prev, pendingRequests: prev.pendingRequests + 1 }));
        } catch {
            alert('Gagal mengirim request');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Beranda</h1>
                            <p className="text-gray-600 mt-1">
                                Monitor stok, request barang, dan kelola kebutuhan inventory per ruangan.
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                {isRefreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Barang" value={stats.totalItems} color="blue" icon={Package} />
                    <StatCard title="Tersedia" value={stats.availableItems} color="green" icon={CheckCircle} />
                    <StatCard title="Request Pending" value={stats.pendingRequests} color="yellow" icon={Clock} />
                    <StatCard title="Disetujui" value={stats.approvedRequests} color="purple" icon={TrendingUp} />
                </div>

                {/* Low stock alert */}
                {lowStockItems.length > 0 && (
                    <LowStockAlert lowStockItems={lowStockItems} />
                )}

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Favorit */}
                    <FavoriteItems
                        favoriteItems={favoriteItems}
                        products={products}
                        handleQuickRequest={handleQuickRequest}
                    />
                    {/* Sidebar */}
                    <div className="space-y-6">
                        <PopularProducts popularProducts={popularProducts} />
                        <RecentActivities
                            recentActivities={recentActivities}
                            getTimeAgo={getTimeAgo}
                        />
                    </div>
                </div>

            </div>

            {/* Request Modal */}
            {showRequestModal && selectedItem && (
                <RequestModal
                    selectedItem={selectedItem}
                    requestQuantity={requestQuantity}
                    setRequestQuantity={setRequestQuantity}
                    requestNote={requestNote}
                    setRequestNote={setRequestNote}
                    onClose={() => setShowRequestModal(false)}
                    onSubmit={submitRequest}
                />
            )}
        </div>
    );
};

export default UserDashboard;
