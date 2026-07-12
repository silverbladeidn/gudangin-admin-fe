import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

import {
    Filter,
    FileSpreadsheet,
    HandHelping,
    File,
    Search,
    Package,
    AlertTriangle,
    CheckCircle,
    ChevronUp,
    ChevronDown,
    X,
    TrendingUp,
    Eye,
    XCircle,
    Clock,
} from 'lucide-react';
import RequestTable from '../components/ApprovalNote/RequestTable';

const ApprovalNote = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [requests, setRequests] = useState([]);
    const [loadingActions, setLoadingActions] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [advancedFilters, setAdvancedFilters] = useState({
        userId: '',
        startDate: '',
        endDate: ''
    });
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

    // Fetch data - disederhanakan
    const fetchRequests = async (page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

            if (!token) {
                setError('Token tidak ditemukan');
                return;
            }

            const params = {
                page,
                my_requests: true // Parameter khusus untuk request user yang login
            };

            if (filterStatus !== 'all') params.status = filterStatus;
            if (searchQuery.trim()) params.search = searchQuery.trim();

            const response = await axios.get(`http://127.0.0.1:8000/api/approval-lists`, {
                params,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                const data = response.data.data;
                setRequests(data.data || []);
                setCurrentPage(data.current_page || 1);
                setTotalPages(data.last_page || 1);
                setError(null);
            }
        } catch (err) {
            setError(err.response?.status === 401 ?
                'Sesi login telah berakhir' : 'Gagal mengambil data');
        } finally {
            setLoading(false);
        }
    };

    // useEffect tetap sama
    useEffect(() => {
        fetchRequests(1);
    }, [filterStatus, searchQuery]);


    // Sorting disederhanakan
    const handleSort = (field) => {
        setSortField(field);
        setSortDirection(prev => sortField === field ?
            (prev === 'asc' ? 'desc' : 'asc') : 'asc');
    };

    // Get sorted data - disederhanakan
    const getSortedData = (data) => {
        return [...data].sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            // Handle special fields
            if (sortField === 'created_at') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            } else if (sortField === 'items_count') {
                aValue = a.details?.length || 0;
                bValue = b.details?.length || 0;
            }

            return sortDirection === 'asc' ?
                (aValue < bValue ? -1 : 1) :
                (aValue > bValue ? -1 : 1);
        });
    };

    // Clear filters function - ADDED
    const clearFilters = () => {
        setAdvancedFilters({
            userId: '',
            startDate: '',
            endDate: ''
        });
        setSearchQuery('');
        setFilterStatus('all');
    };

    // Export to Excel - disederhanakan
    const exportToExcel = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Riwayat Permintaan');

            worksheet.addRow(['Request Number', 'User', 'Status', 'Total Items', 'Note', 'Created At']);

            filteredItems.forEach(item => {
                worksheet.addRow([
                    item.request_number,
                    item.user?.name || 'Unknown User',
                    item.status,
                    item.details?.length || 0,
                    item.note || '-',
                    new Date(item.created_at).toLocaleDateString()
                ]);
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `item_requests_${new Date().toISOString().slice(0, 10)}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('Failed to export Excel file');
        }
    };

    // Export to PDF - disederhanakan
    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.text('Item Request Report', 14, 20);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

            const tableColumns = ['Request Number', 'User', 'Status', 'Items', 'Created At'];
            const tableRows = filteredItems.map(item => [
                item.request_number,
                item.user?.name || 'Unknown',
                item.status,
                item.details?.length || 0,
                new Date(item.created_at).toLocaleDateString()
            ]);

            autoTable(doc, {
                head: [tableColumns],
                body: tableRows,
                startY: 40,
                styles: { fontSize: 8 }
            });

            doc.save(`item_requests_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (error) {
            alert('Failed to export PDF file');
        }
    };

    // Status functions disederhanakan
    const getStatusIcon = (status) => {
        const icons = {
            draft: <Clock className="w-4 h-4 text-lime-500" />,
            pending: <Clock className="w-4 h-4 text-yellow-500" />,
            approved: <CheckCircle className="w-4 h-4 text-green-500" />,
            rejected: <XCircle className="w-4 h-4 text-red-500" />,
            cancelled: <XCircle className="w-4 h-4 text-black" />,
            partially_approved: <TrendingUp className="w-4 h-4 text-cyan-500" />,
            completed: <Package className="w-4 h-4 text-blue-500" />
        };
        return icons[status] || <Package className="w-4 h-4 text-gray-500" />;
    };

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-lime-100 text-lime-800',
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-white-100 text-red-800',
            cancelled: 'bg-white text-black border-black border-2',
            partially_approved: 'bg-cyan-100 text-cyan-800',
            completed: 'bg-blue-100 text-blue-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    // Format date disederhanakan
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Page change - disederhanakan
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            fetchRequests(newPage);
        }
    };

    // Render sort icon - disederhanakan
    const renderSortIcon = (field) => {
        if (sortField !== field) return <div className="w-4 h-4" />;
        return sortDirection === 'asc' ?
            <ChevronUp className="w-4 h-4" /> :
            <ChevronDown className="w-4 h-4" />;
    };

    // Data filtering - disederhanakan
    const filteredItems = getSortedData(requests);

    // Handler functions untuk approval - DITAMBAHKAN
    const handleApprove = async (requestId) => {
        setLoadingActions(prev => ({ ...prev, [requestId]: 'approve' }));
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

            const response = await axios.post(
                `http://127.0.0.1:8000/api/item-requests/${requestId}/approve`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                alert('Request berhasil diapprove!');
                fetchRequests(currentPage); // Refresh data
            } else {
                alert('Gagal approve request: ' + response.data.message);
            }
        } catch (error) {
            console.error('Error approving request:', error);
            alert('Terjadi kesalahan saat approve request');
        } finally {
            setLoadingActions(prev => ({ ...prev, [requestId]: null }));
        }
    };

    const handlePartialApprove = async (requestId) => {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

            const response = await axios.post(
                `http://127.0.0.1:8000/api/item-requests/${requestId}/partial-approve`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                alert('Request berhasil partially approved!');
                fetchRequests(currentPage); // Refresh data
            } else {
                alert('Gagal partial approve request: ' + response.data.message);
            }
        } catch (error) {
            console.error('Error partial approving request:', error);
            alert('Terjadi kesalahan saat partial approve request');
        }
    };

    const handleReject = async (requestId) => {
        try {
            setLoadingActions(prev => ({ ...prev, [requestId]: 'reject' }));
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

            // Minta alasan penolakan
            const note = prompt('Masukkan alasan penolakan:') || 'Request ditolak';

            const response = await axios.post(
                `http://127.0.0.1:8000/api/item-requests/${requestId}/reject`,
                {
                    note: note // Sesuai dengan input('note') di backend
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                alert('Request berhasil ditolak!');
                fetchRequests(currentPage); // Refresh data
            } else {
                alert('Gagal reject request: ' + response.data.message);
            }
        } catch (error) {
            console.error('Error rejecting request:', error);

            // Handle error lebih spesifik
            if (error.response?.status === 500) {
                alert('Server error. Silakan coba lagi nanti.');
            } else if (error.response?.data?.message) {
                alert('Error: ' + error.response.data.message);
            } else {
                alert('Terjadi kesalahan saat menolak request');
            }
        } finally {
            setLoadingActions(prev => ({ ...prev, [requestId]: null }));
        }
    };

    // Tampilkan loading state
    if (loading && requests.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    // Tampilkan error state
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">{error}</p>
                    <button
                        onClick={() => fetchRequests(1)}
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Persetujuan</h1>
                    <p className="text-gray-600 mt-1">Memberikan tanggapan segala permintaan dari pengguna</p>
                </div>

                <button
                    onClick={() => fetchRequests(currentPage)}
                    className="px-4 py-2 border font-medium text-white bg-green-500 border-gray-300 rounded-xl hover:bg-green-700 transition-colors"
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari berdasarkan request number atau nama user"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="partially_approved">Partially Approved</option>
                                <option value="completed">Completed</option>
                            </select>

                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Filter Lanjutan
                            </button>

                            <button
                                onClick={exportToExcel}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                            >
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Excel
                            </button>

                            <button
                                onClick={exportToPDF}
                                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                            >
                                <File className="w-4 h-4 mr-2" />
                                PDF
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <div className="border-t pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                                    <input
                                        type="text"
                                        placeholder="User ID"
                                        value={advancedFilters.userId}
                                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, userId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                                    <input
                                        type="date"
                                        value={advancedFilters.startDate}
                                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
                                    <input
                                        type="date"
                                        value={advancedFilters.endDate}
                                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, endDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Reset Filter
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Requests Table */}
            <RequestTable
                requests={filteredItems}
                onSort={handleSort}
                sortField={sortField}
                sortDirection={sortDirection}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
                renderSortIcon={renderSortIcon}
                user={currentUser}
                onApprove={handleApprove}
                onPartialApprove={handlePartialApprove}
                onReject={handleReject}
            />

            {/* Pagination */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {filteredItems.length} requests (Page {currentPage} of {totalPages})
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        <span className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm">
                            {currentPage}
                        </span>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApprovalNote;