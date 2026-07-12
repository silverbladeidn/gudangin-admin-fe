import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    Plus,
    Filter,
    FileSpreadsheet,
    File,
    Search,
    Package,
    AlertTriangle,
    CheckCircle,
    ChevronUp,
    ChevronDown,
    X,
    TrendingUp,
    TrendingDown,
    RotateCcw
} from 'lucide-react';

const StockNote = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [stockNotes, setStockNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Sorting state
    const [sortField, setSortField] = useState('id');
    const [sortDirection, setSortDirection] = useState('asc');

    // Advanced filters
    const [advancedFilters, setAdvancedFilters] = useState({
        productId: '',
        quantityMin: '',
        quantityMax: '',
        startDate: '',
        endDate: ''
    });

    // Fungsi untuk mengambil data stock movements dari API
    const fetchStockNotes = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://127.0.0.1:8000/api/stockmovement');
            console.log("API result:", response.data);

            // Ambil array stock movements
            setStockNotes(response.data.data.data || response.data.data);
            setError(null);
        } catch (err) {
            setError('Gagal mengambil data stock movements');
            console.error('Error fetching stock movements:', err);
        } finally {
            setLoading(false);
        }
    };

    // Panggil fetchStockNotes saat komponen dimount
    useEffect(() => {
        fetchStockNotes();
    }, []);

    // Sorting function
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Get sorted data
    const getSortedData = (data) => {
        return [...data].sort((a, b) => {
            let aValue, bValue;

            switch (sortField) {
                case 'product_name':
                    aValue = a.product?.name?.toLowerCase() || '';
                    bValue = b.product?.name?.toLowerCase() || '';
                    break;
                case 'type':
                    aValue = a.type;
                    bValue = b.type;
                    break;
                case 'quantity':
                    aValue = a.quantity;
                    bValue = b.quantity;
                    break;
                case 'previous_stock':
                    aValue = a.previous_stock;
                    bValue = b.previous_stock;
                    break;
                case 'current_stock':
                    aValue = a.current_stock;
                    bValue = b.current_stock;
                    break;
                case 'created_at':
                    aValue = new Date(a.created_at);
                    bValue = new Date(b.created_at);
                    break;
                default:
                    aValue = a[sortField];
                    bValue = b[sortField];
            }

            if (sortDirection === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
    };

    // Export to Excel
    const exportToExcel = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Catatan Stok');

            // Add headers
            const headers = ['ID', 'Nama Produk', 'SKU', 'Tipe', 'Kuantitas', 'Jumlah Stok Sebelum', 'Jumlah Stok Sesudah', 'Catatan', 'Tanggal'];
            worksheet.addRow(headers);

            // Add data
            filteredItems.forEach(item => {
                worksheet.addRow([
                    item.id,
                    item.product?.name || 'Unknown Product',
                    item.type,
                    item.quantity,
                    item.previous_stock,
                    item.current_stock,
                    item.reference || '-',
                    new Date(item.created_at).toLocaleDateString()
                ]);
            });

            // Generate and download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `stock_movements_${new Date().toISOString().slice(0, 10)}.xlsx`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Failed to export Excel file');
        }
    };

    // Export to PDF
    const exportToPDF = () => {
        try {
            const doc = new jsPDF();

            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Stock Movement Report', 14, 20);

            // Date
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

            // Table data
            const tableColumns = ['ID', 'Product', 'Type', 'Qty', 'Prev Stock', 'Current Stock', 'Date'];
            const tableRows = filteredItems.map(item => [
                item.id,
                item.product?.name || 'Unknown',
                item.type,
                item.quantity,
                item.previous_stock,
                item.current_stock,
                new Date(item.created_at).toLocaleDateString()
            ]);

            // Generate table
            autoTable(doc, {
                head: [tableColumns],
                body: tableRows,
                startY: 40,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                },
                headStyles: {
                    fillColor: [230, 230, 250],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 35 },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 15 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 20 },
                    6: { cellWidth: 25 }
                }
            });

            doc.save(`stock_movements_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            alert('Failed to export PDF file');
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setFilterType('all');
        setAdvancedFilters({
            productId: '',
            quantityMin: '',
            quantityMax: '',
            startDate: '',
            endDate: ''
        });
    };

    // Get type icon
    const getTypeIcon = (type) => {
        switch (type) {
            case 'in':
                return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'out':
                return <TrendingDown className="w-4 h-4 text-red-500" />;
            case 'adjustment':
                return <RotateCcw className="w-4 h-4 text-blue-500" />;
            default:
                return <Package className="w-4 h-4 text-gray-500" />;
        }
    };

    // Get type color
    const getTypeColor = (type) => {
        switch (type) {
            case 'in':
                return 'bg-green-100 text-green-800';
            case 'out':
                return 'bg-red-100 text-red-800';
            case 'adjustment':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Tampilkan loading state
    if (loading) {
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
                        onClick={fetchStockNotes}
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    // Filter data
    const filteredItems = getSortedData(stockNotes.filter((item) => {
        const matchesSearch = (item.product?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (item.reference?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || item.type === filterType;
        const matchesProductId = !advancedFilters.productId ||
            item.product_id.toString().includes(advancedFilters.productId);
        const matchesQuantityMin = !advancedFilters.quantityMin ||
            item.quantity >= parseInt(advancedFilters.quantityMin);
        const matchesQuantityMax = !advancedFilters.quantityMax ||
            item.quantity <= parseInt(advancedFilters.quantityMax);
        const matchesStartDate = !advancedFilters.startDate ||
            new Date(item.created_at) >= new Date(advancedFilters.startDate);
        const matchesEndDate = !advancedFilters.endDate ||
            new Date(item.created_at) <= new Date(advancedFilters.endDate);

        return matchesSearch && matchesType && matchesProductId &&
            matchesQuantityMin && matchesQuantityMax && matchesStartDate && matchesEndDate;
    }));

    // Render sort icon
    const renderSortIcon = (field) => {
        if (sortField !== field) {
            return <div className="w-4 h-4"></div>;
        }
        return sortDirection === 'asc' ?
            <ChevronUp className="w-4 h-4" /> :
            <ChevronDown className="w-4 h-4" />;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Riwayat Penyimpanan</h1>
                    <p className="text-gray-600 mt-1">Merekam segala penyimpanan atau pengeluaran barang-barang.</p>
                </div>
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
                                    placeholder="Cari barang sesuai nama dan referensi"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">Semua Status</option>
                                <option value="in">Stock In</option>
                                <option value="out">Stock Out</option>
                                <option value="adjustment">Adjustment</option>
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
                                Ekspor ke Excel
                            </button>

                            <button
                                onClick={exportToPDF}
                                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                            >
                                <File className="w-4 h-4 mr-2" />
                                Ekspor ke PDF
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <div className="border-t pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Barang</label>
                                    <input
                                        type="text"
                                        placeholder="ID Barang"
                                        value={advancedFilters.productId}
                                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, productId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kuantitas Minimum</label>
                                    <input
                                        type="number"
                                        placeholder="Kuantitas Minimum"
                                        value={advancedFilters.quantityMin}
                                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, quantityMin: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kuantitas Maksimum</label>
                                    <input
                                        type="number"
                                        placeholder="Kuantitas Maksimum"
                                        value={advancedFilters.quantityMax}
                                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, quantityMax: e.target.value })}
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
                                    Ulangi Filter
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stock Movement Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('id')}
                                >
                                    <div className="flex items-center justify-between">
                                        ID
                                        {renderSortIcon('id')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('product_name')}
                                >
                                    <div className="flex items-center justify-between">
                                        Barang
                                        {renderSortIcon('product_name')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('type')}
                                >
                                    <div className="flex items-center justify-between">
                                        Status
                                        {renderSortIcon('type')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('quantity')}
                                >
                                    <div className="flex items-center justify-between">
                                        Kuantitas
                                        {renderSortIcon('quantity')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('previous_stock')}
                                >
                                    <div className="flex items-center justify-between">
                                        Jumlah Stok Sebelumnya
                                        {renderSortIcon('previous_stock')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('current_stock')}
                                >
                                    <div className="flex items-center justify-between">
                                        Jumlah Stok Terkini
                                        {renderSortIcon('current_stock')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Catatan
                                </th>
                                <th
                                    className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('created_at')}
                                >
                                    <div className="flex items-center justify-between">
                                        Tanggal dan Waktu
                                        {renderSortIcon('created_at')}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredItems.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className="hover:bg-gray-50 transition-colors animate-fade-in-up"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {item.id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center overflow-hidden">
                                                {item.product?.image_url ? (
                                                    <img
                                                        src={
                                                            item.product?.image_url
                                                                ? item.product.image_url.replace(/\s*\(\d+×\d+\)/, '')
                                                                : ''
                                                        }
                                                        alt={item.product?.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            console.log('Gambar gagal dimuat:', item.product?.image_url);
                                                            e.target.style.display = 'none';
                                                            e.target.nextElementSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}

                                                <div
                                                    className="w-full h-full flex items-center justify-center"
                                                    style={{ display: item.product?.image_url ? 'none' : 'flex' }}
                                                >
                                                    <Package className="w-5 h-5 text-white" />
                                                </div>
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.product?.name || 'Unknown Product'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ID: {item.product_id}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                                            {getTypeIcon(item.type)}
                                            <span className="ml-1 capitalize">{item.type}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="text-sm font-medium text-gray-900">
                                            {item.type === 'out' ? '-' : '+'}{item.quantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                        {item.previous_stock}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                                        {item.current_stock}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                        {item.reference || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                        {formatDate(item.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {filteredItems.length} of {stockNotes.length} movements
                    </div>
                    <div className="flex space-x-2">
                        <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                            Previous
                        </button>
                        <button className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
                            1
                        </button>
                        <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockNote;