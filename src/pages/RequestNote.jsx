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
import RequestDetailModal from '../components/RequestNote/RequestDetailModal';
import RequestUpdateModal from '../components/RequestNote/RequestUpdateModal';
import RequestTable from '../components/RequestNote/RequestTable';

const RequestNote = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [requestItems, setRequestItems] = useState({});
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        userId: '',
        startDate: '',
        endDate: ''
    });
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateId, setUpdateId] = useState(null);
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({
        product_id: "",
        quantity: 1,
        note: ""
    });
    const [updatedDetails, setUpdatedDetails] = useState([]);
    const [updateData, setUpdateData] = useState(null);

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

            const response = await axios.get(`http://127.0.0.1:8000/api/item-requests`, {
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

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
                const res = await axios.get("http://127.0.0.1:8000/api/products", {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (Array.isArray(res.data)) {
                    setProducts(res.data);
                } else if (res.data.data && Array.isArray(res.data.data)) {
                    setProducts(res.data.data);
                }
            } catch (err) {
                console.error("Gagal fetch products", err);
            }
        };

        fetchProducts();
    }, []);

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

    // View details - disederhanakan
    const handleViewDetails = async (requestId) => {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            const response = await axios.get(
                `http://127.0.0.1:8000/api/item-requests/${requestId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success) {
                setSelectedRequest(response.data.data);
                setShowDetailModal(true);
            }
        } catch (error) {
            alert('Terjadi kesalahan saat memuat detail request');
        }
    };

    // Handle update request - UPDATED
    const handleUpdateRequest = async (requestId) => {
        setUpdateId(requestId);
        setShowUpdateModal(true);

        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

            // Fetch request detail untuk mendapatkan data lengkap
            const res = await axios.get(`http://127.0.0.1:8000/api/item-requests/${requestId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data.success && res.data.data) {
                const requestData = res.data.data;
                setUpdateData(requestData); // Simpan data lengkap request

                // Set form dengan data yang ada
                setForm({
                    product_id: "",
                    quantity: 1,
                    note: requestData.note || ""
                });

                // Reset updated details
                setUpdatedDetails([]);
            }
        } catch (err) {
            console.error("Gagal ambil detail request", err);
            alert('Gagal mengambil data request');
        }
    };

    // Cancel request - disederhanakan
    const handleCancelRequest = async (requestId) => {
        if (!confirm('Apakah Anda yakin ingin membatalkan request ini?')) return;

        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            const response = await axios.post(
                `http://127.0.0.1:8000/api/item-requests/${requestId}/cancel`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                alert('Request berhasil dibatalkan!');
                fetchRequests(currentPage);
            }
        } catch (error) {
            alert('Terjadi kesalahan saat membatalkan request');
        }
    };

    const handleSubmitUpdate = async (action = 'draft') => {
        if (!updateData || !updateData.details || updateData.details.length === 0) {
            alert('Tidak ada item dalam request!');
            return;
        }

        // Validasi stok jika submit
        if (action === 'submit') {
            const stockIssues = updateData.details.filter(detail => {
                const product = products.find(p => p.id === detail.product_id);
                const requestedQty = updatedDetails.find(ud => ud.id === detail.id)?.requested_quantity || detail.requested_quantity;
                return product && requestedQty > product.stock_quantity;
            });

            if (stockIssues.length > 0) {
                alert('Beberapa item melebihi stok yang tersedia. Silakan periksa kembali jumlah yang diminta.');
                return;
            }
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

            // Prepare data for API
            const payload = {
                note: form.note !== undefined ? form.note : updateData.note,
                action: action, // 'draft' atau 'submit'
                details: updateData.details.map(detail => {
                    // Gunakan quantity yang diupdate jika ada, otherwise gunakan yang lama
                    const updatedDetail = updatedDetails.find(ud => ud.id === detail.id);
                    return {
                        product_id: detail.product_id,
                        qty: updatedDetail ? updatedDetail.requested_quantity : detail.requested_quantity
                    };
                })
            };

            const response = await axios.put(
                `http://127.0.0.1:8000/api/item-requests/${updateId}`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                alert(action === 'submit'
                    ? 'Request berhasil dikirim!'
                    : 'Draft berhasil disimpan!'
                );

                // Reset semua state
                setShowUpdateModal(false);
                setUpdateId(null);
                setUpdateData(null);
                setForm({ product_id: "", quantity: 1, note: "" });
                setUpdatedDetails([]);

                // Refresh data
                fetchRequests(currentPage);
            } else {
                alert(response.data.message || 'Gagal menyimpan perubahan');
            }
        } catch (err) {
            console.error("Gagal update request", err);
            alert('Gagal update request: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitFromUpdateModal = async () => {
        if (!updateData || !updateData.details || updateData.details.length === 0) {
            alert('Tidak ada item dalam request!');
            return;
        }

        // Validasi stok
        const stockIssues = updateData.details.filter(detail => {
            const product = products.find(p => p.id === detail.product_id);
            const requestedQty = updatedDetails.find(ud => ud.id === detail.id)?.requested_quantity || detail.requested_quantity;
            return product && requestedQty > product.stock_quantity;
        });

        if (stockIssues.length > 0) {
            alert('Beberapa item melebihi stok yang tersedia. Silakan periksa kembali jumlah yang diminta.');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

            // 1. UPDATE DATA DULU menggunakan PUT
            const updatePayload = {
                note: form.note !== undefined ? form.note : updateData.note,
                action: 'draft', // Simpan dulu sebagai draft
                details: updateData.details.map(detail => {
                    const updatedDetail = updatedDetails.find(ud => ud.id === detail.id);
                    return {
                        product_id: detail.product_id,
                        qty: updatedDetail ? updatedDetail.requested_quantity : detail.requested_quantity
                    };
                })
            };

            const updateResponse = await axios.put(
                `http://127.0.0.1:8000/api/item-requests/${updateId}`,
                updatePayload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (updateResponse.data.success) {
                // 2. SETELAH UPDATE BERHASIL, SUBMIT menggunakan POST /submit
                const submitResponse = await axios.post(
                    `http://127.0.0.1:8000/api/item-requests/${updateId}/submit`,
                    {},
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (submitResponse.data.success) {
                    alert('Request berhasil dikirim!');

                    // Reset semua state
                    setShowUpdateModal(false);
                    setUpdateId(null);
                    setUpdateData(null);
                    setForm({ product_id: "", quantity: 1, note: "" });
                    setUpdatedDetails([]);

                    // Refresh data
                    fetchRequests(currentPage);
                }
            }
        } catch (err) {
            console.error("Gagal update dan submit request", err);
            alert('Gagal mengirim request: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
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

    // Fungsi untuk handle update quantity
    const handleUpdateQuantity = (detailId, newQuantity) => {
        setUpdatedDetails(prev => {
            const existing = prev.find(d => d.id === detailId);
            if (existing) {
                return prev.map(d => d.id === detailId ? { ...d, requested_quantity: newQuantity } : d);
            } else {
                return [...prev, { id: detailId, requested_quantity: newQuantity }];
            }
        });
    };

    // Fungsi untuk handle remove item
    const handleRemoveItem = (detailId) => {
        if (updateData) {
            setUpdateData(prev => ({
                ...prev,
                details: prev.details.filter(d => d.id !== detailId)
            }));
        }
    };

    // Fungsi untuk handle add item
    const handleAddItemToRequest = () => {
        if (!form.product_id || form.quantity < 1) {
            alert('Pilih produk dan jumlah yang valid!');
            return;
        }

        const selectedProduct = products.find(p => p.id === parseInt(form.product_id));
        if (!selectedProduct) {
            alert('Produk tidak ditemukan!');
            return;
        }

        // Cek apakah produk sudah ada di details
        const isProductExist = updateData?.details?.some(detail =>
            detail.product_id === parseInt(form.product_id)
        );

        if (isProductExist) {
            alert('Produk ini sudah ada dalam request!');
            return;
        }

        // Cek stok
        if (form.quantity > selectedProduct.stock_quantity) {
            alert(`Stok tidak mencukupi! Stok tersedia: ${selectedProduct.stock_quantity}`);
            return;
        }

        const newItem = {
            id: `new-${Date.now()}`, // temporary ID for new items
            product_id: parseInt(form.product_id),
            requested_quantity: form.quantity,
            product: selectedProduct,
            status: 'draft'
        };

        setUpdateData(prev => ({
            ...prev,
            details: [...prev.details, newItem]
        }));

        // Reset form
        setForm({ product_id: "", quantity: 1, note: form.note });
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
                    <h1 className="text-3xl font-bold text-gray-900">Riwayat Permintaan</h1>
                    <p className="text-gray-600 mt-1">Merekam segala permintaan yang dilakukan oleh pengguna</p>
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
                                <option value="draft">Draft</option>
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
                onViewDetails={handleViewDetails}
                onUpdateRequest={handleUpdateRequest}
                onCancelRequest={handleCancelRequest}
                onSort={handleSort}
                sortField={sortField}
                sortDirection={sortDirection}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
                renderSortIcon={renderSortIcon}
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

            <RequestDetailModal
                show={showDetailModal}
                selectedRequest={selectedRequest}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedRequest(null);
                }}
                loading={loading}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
            />

            <RequestUpdateModal
                show={showUpdateModal}
                updateData={updateData}
                onClose={() => {
                    setShowUpdateModal(false);
                    setUpdateId(null);
                    setUpdateData(null);
                    setForm({ product_id: "", quantity: 1, note: "" });
                    setUpdatedDetails([]);
                }}
                loading={loading}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
                products={products}
                form={form}
                updatedDetails={updatedDetails}
                setForm={setForm}
                setUpdatedDetails={setUpdatedDetails}
                handleUpdateQuantity={handleUpdateQuantity}
                handleRemoveItem={handleRemoveItem}
                handleAddItemToRequest={handleAddItemToRequest}
                handleSubmitUpdate={handleSubmitUpdate}
                handleSubmitFromUpdateModal={handleSubmitFromUpdateModal}
            />
        </div>
    );
};

export default RequestNote;