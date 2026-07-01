import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, Loader, RefreshCw } from 'lucide-react';
import axios from 'axios';
// Configure axios defaults
axios.defaults.baseURL = 'http://127.0.0.1:8000';

// Add token to all requests if available
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Accept'] = 'application/json';
    config.headers['Content-Type'] = 'application/json';
    return config;
});

// Handle 401 responses globally
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Remove invalid token and redirect to login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);
const RecentActivity = () => {
    const [activities, setActivities] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Base URL for your API
    const API_BASE_URL = 'http://127.0.0.1:8000/api';

    useEffect(() => {
        fetchRecentActivities();
    }, []);

    const fetchRecentActivities = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch data from both endpoints concurrently
            const [productsResponse, stockMovementResponse] = await Promise.all([
                axios.get(`${API_BASE_URL}/products`),
                axios.get(`${API_BASE_URL}/stockmovement`)
            ]);

            // Extract data from Laravel API response structure
            const products = productsResponse.data.data.data || [];
            const stockMovements = stockMovementResponse.data.data.data || [];

            // Transform the API data into activity format
            const transformedActivities = transformDataToActivities(products, stockMovements);

            setActivities(transformedActivities);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load recent activities');
        } finally {
            setLoading(false);
        }
    };

    // Transform API data into activities format
    const transformDataToActivities = (products, stockMovements) => {
        const activities = [];

        // Transform stock movements into activities
        if (stockMovements && Array.isArray(stockMovements)) {
            const recentMovements = stockMovements
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 8); // Get 8 most recent movements

            recentMovements.forEach(movement => {
                // Use product data from the movement response (it includes product info)
                const productName = movement.product ? movement.product.name : `Product ID: ${movement.product_id}`;

                let activityType = 'info';
                let action = 'Pergerakan Stok';

                // Determine activity type based on movement type
                if (movement.type === 'in') {
                    activityType = 'success';
                    action = 'Stok Ditambahkan';
                } else if (movement.type === 'out') {
                    activityType = 'warning';
                    action = 'Stok Dikurangi';
                }

                // Create descriptive item text
                const stockInfo = `${movement.previous_stock} → ${movement.current_stock}`;
                const itemText = `${productName} (${stockInfo})`;

                activities.push({
                    id: `movement-${movement.id}`,
                    type: activityType,
                    action: action,
                    item: itemText,
                    time: formatTime(movement.created_at),
                    rawTime: movement.created_at,
                    reference: movement.reference,
                    notes: movement.notes
                });
            });
        }

        // Transform recent product updates into activities (only if updated recently)
        if (products && Array.isArray(products)) {
            const recentProducts = products
                .filter(product => {
                    const updated = new Date(product.updated_at);
                    const created = new Date(product.created_at);
                    // Only show if updated after creation (actually updated, not just created)
                    return updated > created;
                })
                .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                .slice(0, 3); // Get 3 most recent product updates

            recentProducts.forEach(product => {
                activities.push({
                    id: `product-${product.id}`,
                    type: 'info',
                    action: 'Produk Diperbarui',
                    item: `${product.name} - ${product.category?.name || 'Tanpa kategori'}`,
                    time: formatTime(product.updated_at),
                    rawTime: product.updated_at
                });
            });
        }

        // Add low stock alerts
        if (products && Array.isArray(products)) {
            const lowStockProducts = products
                .filter(product => product.status === 'low_stock')
                .slice(0, 3);

            lowStockProducts.forEach(product => {
                activities.push({
                    id: `lowstock-${product.id}`,
                    type: 'warning',
                    action: 'Peringatan Stok Rendah',
                    item: `${product.name} (Stok: ${product.stock_quantity})`,
                    time: formatTime(product.updated_at),
                    rawTime: product.updated_at
                });
            });
        }

        // Sort all activities by time (most recent first) and limit to 10
        return activities
            .sort((a, b) => new Date(b.rawTime) - new Date(a.rawTime))
            .slice(0, 10);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchRecentActivities();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    // Format time to relative time
    const formatTime = (dateString) => {
        if (!dateString) return 'Unknown time';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'warning':
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'info':
                return <Info className="w-4 h-4 text-blue-500" />;
            default:
                return <Info className="w-4 h-4 text-gray-500" />;
        }
    };

    const getActivityBg = (type) => {
        switch (type) {
            case 'success':
                return 'bg-green-50';
            case 'warning':
                return 'bg-yellow-50';
            case 'info':
                return 'bg-blue-50';
            default:
                return 'bg-gray-50';
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Aktivitas Terbaru</h3>
                <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="ml-2 text-gray-600">Memuat aktivitas...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Aktivitas Terbaru</h3>
                <div className="text-center py-8">
                    <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchRecentActivities}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Aktivitas Terbaru</h3>
                <button
                    onClick={handleRefresh}
                    className="flex items-center px-2 py-2 bg-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    disabled={isRefreshing || loading}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
                    {isRefreshing || loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {activities.length === 0 ? (
                <div className="text-center py-8">
                    <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Tidak ada aktivitas terbaru</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {activities.map((activity, index) => (
                        <div
                            key={activity.id}
                            className={`p-4 rounded-lg ${getActivityBg(activity.type)} animate-fade-in-up`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start">
                                <div className="mr-3 mt-0.5">
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">
                                        {activity.action}
                                    </p>
                                    <p className="text-sm text-gray-600 truncate">
                                        {activity.item}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {activity.time}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentActivity;