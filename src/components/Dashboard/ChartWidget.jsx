import React, { useState, useEffect } from 'react';
import {
    RefreshCw,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

import axios from 'axios';

// Configure axios defaults untuk environment Anda
axios.defaults.baseURL = 'http://127.0.0.1:8000';
axios.defaults.timeout = 55000; // Increase timeout to 15 seconds

// Add interceptors untuk handle auth dan error
axios.interceptors.request.use((config) => {
    // Tambahkan auth token jika diperlukan
    const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Accept'] = 'application/json';
    config.headers['Content-Type'] = 'application/json';
    return config;
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized
            console.warn('Unauthorized request - token might be invalid');
            // sessionStorage.removeItem('auth_token');
            // localStorage.removeItem('auth_token');
        }
        return Promise.reject(error);
    }
);

const ChartWidget = () => {
    const [data, setData] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Fetch data dari API menggunakan axios
    const fetchStockData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Fetching data for year:', selectedYear);

            // Gunakan relative URL karena sudah ada baseURL
            const response = await axios.get('/api/stockmovement', {
                params: {
                    year: selectedYear
                }
            });

            console.log('API Response received:', response.data);

            // Transform data untuk chart
            const transformedData = transformApiData(response.data);
            setData(transformedData);

        } catch (err) {
            let errorMessage = 'Gagal mengambil data stock movement';

            if (err.response) {
                // Server responded with error status
                errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
            } else if (err.request) {
                // Request was made but no response received
                errorMessage = 'Tidak ada response dari server. Periksa koneksi Anda.';
            } else if (err.code === 'ECONNABORTED') {
                // Request timeout
                errorMessage = 'Request timeout. Server mungkin sedang lambat.';
            } else {
                // Something else happened
                errorMessage = err.message;
            }

            setError(errorMessage);
            console.error('Error fetching stock data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Transform data API ke format yang dibutuhkan chart
    const transformApiData = (apiData) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        console.log('API Response:', apiData); // Debug log

        try {
            // Ambil data dari response - berdasarkan struktur API Laravel yang Anda tunjukkan
            let movements = [];

            if (apiData?.data?.data && Array.isArray(apiData.data.data)) {
                movements = apiData.data.data;
            } else if (apiData?.data && Array.isArray(apiData.data)) {
                movements = apiData.data;
            } else if (Array.isArray(apiData)) {
                movements = apiData;
            } else {
                console.warn('No valid data array found in API response');
                return [];
            }

            console.log('Found movements:', movements.length);

            // Group data by month dan aggregate by type
            const monthlyData = {};

            // Initialize semua bulan dengan 0
            months.forEach(month => {
                monthlyData[month] = {
                    month,
                    stockIn: 0,
                    stockOut: 0,
                    adjustment: 0
                };
            });

            // Process setiap movement
            movements.forEach(movement => {
                try {
                    const date = new Date(movement.created_at);
                    const year = date.getFullYear();

                    // Hanya proses data sesuai selectedYear
                    if (year === selectedYear) {
                        const monthIndex = date.getMonth();
                        const month = months[monthIndex];

                        if (monthlyData[month]) {
                            // Gunakan quantity untuk menghitung total, bukan count
                            const quantity = Math.abs(movement.quantity || 1);

                            if (movement.type === 'in') {
                                monthlyData[month].stockIn += quantity;
                            } else if (movement.type === 'out') {
                                monthlyData[month].stockOut += quantity;
                            } else if (movement.type === 'adjustment') {
                                monthlyData[month].adjustment += quantity;
                            }
                        }
                    }
                } catch (dateError) {
                    console.warn('Error processing movement date:', movement, dateError);
                }
            });

            // Convert object to array
            const result = months.map(month => monthlyData[month]);
            console.log('Final chart data:', result);
            return result;

        } catch (error) {
            console.error('Error transforming API data:', error);
            // Return empty data jika error
            return months.map(month => ({
                month,
                stockIn: 0,
                stockOut: 0,
                adjustment: 0
            }));
        }
    };

    useEffect(() => {
        fetchStockData();
    }, [selectedYear]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchStockData();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    // Custom tooltip untuk menampilkan data stock movement
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-900 mb-2">{`${label} ${selectedYear}`}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value.toLocaleString()} unit
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-center h-80">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                        <span className="text-gray-500">Memuat data stock movement...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-col items-center justify-center h-80 space-y-4">
                    <div className="text-red-500 text-center">
                        <p className="font-semibold">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg max-w-md">
                        <p className="font-semibold mb-1">Kemungkinan penyebab:</p>
                        <ul className="text-left space-y-1">
                            <li>• Server backend sedang down</li>
                            <li>• API endpoint tidak ditemukan</li>
                            <li>• Masalah CORS configuration</li>
                            <li>• Database query terlalu lambat</li>
                            <li>• Network connectivity issue</li>
                        </ul>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    const hasData = data && data.some(item =>
        (item.stockIn || 0) + (item.stockOut || 0) + (item.adjustment || 0) > 0
    );

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Stock Movement {selectedYear}</h3>

                {/* Year Selector */}
                <div className="flex items-center space-x-4">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {[2021, 2022, 2023, 2024, 2025].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleRefresh}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                        disabled={isRefreshing || loading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
                        {isRefreshing || loading ? 'Memuat...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Data Info */}
            {!hasData && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 text-sm">
                        Tidak ada data stock movement untuk tahun {selectedYear}.
                        Coba pilih tahun lain atau tambahkan data stock movement dengan tanggal yang berbeda.
                    </p>
                </div>
            )}

            {/* Legend */}
            <div className="flex space-x-4 text-sm mb-4">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">Stock In</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">Stock Out</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">Adjustment</span>
                </div>
            </div>

            <div className="h-96 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{
                            top: 25,
                            right: 35,
                            left: 25,
                            bottom: 10,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="stockIn"
                            name="Stock In"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                            activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2, fill: 'white' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="stockOut"
                            name="Stock Out"
                            stroke="#ef4444"
                            strokeWidth={3}
                            dot={{ fill: '#ef4444', strokeWidth: 2, r: 6 }}
                            activeDot={{ r: 8, stroke: '#ef4444', strokeWidth: 2, fill: 'white' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="adjustment"
                            name="Adjustment"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                            activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Summary Statistics */}
            <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                        {data.reduce((sum, item) => sum + (item.stockIn || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Total Stock In</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                        {data.reduce((sum, item) => sum + (item.stockOut || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Total Stock Out</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                        {data.reduce((sum, item) => sum + (item.adjustment || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Total Adjustment</p>
                </div>
            </div>
        </div>
    );
};

export default ChartWidget;