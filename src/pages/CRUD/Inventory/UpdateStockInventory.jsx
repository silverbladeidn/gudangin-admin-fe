import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Package,
    Save,
    X,
    Upload,
    Image,
    Loader,
    Plus,
    Minus,
    RotateCcw,
    AlertTriangle,
    Archive
} from 'lucide-react';
import axios from 'axios';

const UpdateStockInventory = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Mendapatkan product ID dari URL
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [operation, setOperation] = useState('add'); // 'add', 'subtract', 'set'
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Fetch product data saat komponen dimount
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://127.0.0.1:8000/api/products/${id}`);
                setProduct(response.data.data || response.data);
            } catch (error) {
                console.error('Error fetching product:', error);
                setError('Gagal memuat data produk');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    const resetForm = () => {
        setOperation('add');
        setQuantity('');
        setReason('');
        setNotes('');
        setError('');
    };

    const handleBack = () => {
        navigate('/inventory');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!quantity || parseInt(quantity) <= 0) {
            setError('Jumlah harus lebih dari 0');
            return;
        }

        if (!reason.trim()) {
            setError('Alasan wajib diisi');
            return;
        }

        // Validasi untuk operasi subtract
        if (operation === 'subtract' && parseInt(quantity) > product.stock_quantity) {
            setError(`Stok tidak cukup. Stok saat ini: ${product.stock_quantity}`);
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            // Backend mungkin mengharapkan nilai type yang berbeda
            let apiType;
            switch (operation) {
                case 'add':
                    apiType = 'in'; // atau 'increase', 'addition', 'stock_in'
                    break;
                case 'subtract':
                    apiType = 'out'; // atau 'decrease', 'reduction', 'stock_out'
                    break;
                case 'set':
                    apiType = 'adjustment'; // atau 'set', 'correction'
                    break;
                default:
                    apiType = operation;
            }

            const payload = {
                type: apiType,
                quantity: parseInt(quantity),
                reason: reason.trim(),
                notes: notes.trim() || null
            };

            // Debug: tampilkan payload yang akan dikirim
            console.log('Full payload being sent:', JSON.stringify(payload, null, 2));

            console.log('Sending stock update:', payload);

            const response = await axios.post(
                `http://127.0.0.1:8000/api/products/${product.id}/update-stock`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        // Jika menggunakan auth token
                        // 'Authorization': `Bearer ${token}`
                    }
                }
            );

            console.log('Stock update response:', response.data);

            // Update local product state
            const updatedProduct = response.data.data || response.data;
            setProduct(prev => ({ ...prev, stock_quantity: updatedProduct.stock_quantity || updatedProduct.stock }));

            alert('Stok berhasil diperbarui!');
            resetForm();

            navigate('/inventory');
        } catch (error) {
            console.error('Error updating stock:', error);
            console.error('Error response status:', error.response?.status);
            console.error('Error response data:', JSON.stringify(error.response?.data, null, 2));
            console.error('Error response headers:', error.response?.headers);

            let errorMessage = 'Gagal memperbarui stok.';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.errors) {
                const errors = Object.values(error.response.data.errors).flat();
                errorMessage = errors.join(', ');

                // Tampilkan detail error validasi
                console.error('Validation errors:', error.response.data.errors);
            } else if (error.response?.status === 422) {
                errorMessage = 'Data yang dikirim tidak valid. Periksa console untuk detail error.';
            }

            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const getOperationColor = () => {
        switch (operation) {
            case 'add': return 'text-green-600 bg-green-50 border-green-200';
            case 'subtract': return 'text-red-600 bg-red-50 border-red-200';
            case 'set': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getOperationIcon = () => {
        switch (operation) {
            case 'add': return <Plus className="w-4 h-4" />;
            case 'subtract': return <Minus className="w-4 h-4" />;
            case 'set': return <RotateCcw className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    const calculateNewStock = () => {
        if (!quantity || !product) return product?.stock_quantity || 0;

        const qty = parseInt(quantity);
        const currentStock = product.stock_quantity;

        switch (operation) {
            case 'add': return currentStock + qty;
            case 'subtract': return Math.max(0, currentStock - qty);
            case 'set': return qty;
            default: return currentStock;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="text-gray-600">Memuat data produk...</span>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Produk Tidak Ditemukan</h3>
                    <p className="text-gray-600 mb-4">Produk yang Anda cari tidak ditemukan.</p>
                    <Link
                        to="/inventory"
                        className="inline-flex items-center text-gray-600 rounded-lg px-3 py-1 hover:bg-green-400 hover:text-black mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Inventory
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleBack}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <div className="flex items-center space-x-3">
                                    <Archive className="w-6 h-6 text-green-600" />
                                    <div>
                                        <h1 className="text-xl font-semibold text-gray-900">Update Stok Inventori</h1>
                                        <p className="text-sm text-gray-600">{product.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-xl shadow-sm">
                        {/* Product Info */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-medium text-gray-900">{product.name}</h2>
                                    <p className="text-sm text-gray-600 mt-1">SKU: {product.sku || '-'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Stok Saat Ini</p>
                                    <p className="text-3xl font-bold text-gray-900">{product.stock_quantity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Stok Minimum</p>
                                    <p className="text-3xl font-bold text-gray-900">{product.min_stock_level}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Stok Maksimum</p>
                                    <p className="text-3xl font-bold text-gray-900">{product.max_stock_level}</p>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Operation Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Jenis Operasi
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'add', label: 'Tambah Stok', icon: Plus, desc: 'Menambahkan stok' },
                                        { value: 'subtract', label: 'Kurangi Stok', icon: Minus, desc: 'Mengurangi stok' },
                                        { value: 'set', label: 'Set Stok', icon: RotateCcw, desc: 'Mengatur ulang stok' }
                                    ].map(({ value, label, icon: Icon, desc }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setOperation(value)}
                                            className={`p-4 border rounded-lg text-sm font-medium transition-colors flex flex-col items-center space-y-2 ${operation === value
                                                ? getOperationColor()
                                                : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="font-medium">{label}</span>
                                            <span className="text-xs opacity-75">{desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Jumlah
                                </label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder={`Masukkan jumlah untuk ${operation === 'add' ? 'ditambahkan' : operation === 'subtract' ? 'dikurangi' : 'diset'}`}
                                    min="1"
                                    required
                                />
                            </div>

                            {/* Stock Preview */}
                            {quantity && (
                                <div className={`p-4 rounded-lg border ${getOperationColor()}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Stok Setelah Operasi:</span>
                                        <span className="text-xl font-bold">
                                            {product.stock_quantity} → {calculateNewStock()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Alasan <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Pilih alasan</option>
                                    <option value="Penjualan">Penjualan</option>
                                    <option value="Pembelian/Restock">Pembelian/Restock</option>
                                    <option value="Stock Opname">Stock Opname</option>
                                    <option value="Damaged/Lost">Barang Rusak/Hilang</option>
                                    <option value="Return">Return/Pengembalian</option>
                                    <option value="Transfer">Transfer Stok</option>
                                    <option value="Adjustment">Penyesuaian</option>
                                    <option value="Other">Lainnya</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Catatan
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Catatan tambahan (opsional)"
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                                    <span className="text-red-700 text-sm">{error}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex space-x-4 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    disabled={submitting}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Update Stok
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateStockInventory;