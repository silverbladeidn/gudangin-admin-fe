import React from 'react';
import { X, Package, Trash } from 'lucide-react';

const RequestUpdateModal = ({
    show,
    updateData,
    onClose,
    loading,
    getStatusIcon,
    getStatusColor,
    formatDate,
    products,
    form,
    updatedDetails,
    setForm,
    setUpdatedDetails,
    handleUpdateQuantity,
    handleRemoveItem,
    handleAddItemToRequest,
    handleSubmitUpdate,
    handleSubmitFromUpdateModal
}) => {
    if (!show || !updateData) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            style={{ position: 'fixed', top: -32, left: -32, right: -32, bottom: -32 }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                        Edit Draft Request: {updateData.request_number}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Request Info */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Informasi Request</h4>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">User:</span>
                                <span className="ml-2">{updateData.user?.name || 'Unknown User'}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Status:</span>
                                <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(updateData.status)}`}>
                                    {getStatusIcon(updateData.status)}
                                    <span className="ml-1 capitalize">{updateData.status}</span>
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Tanggal Request:</span>
                                <span className="ml-2">{formatDate(updateData.created_at)}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Terakhir Diupdate:</span>
                                <span className="ml-2">{formatDate(updateData.updated_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Catatan</h4>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Catatan User:</span>
                                <div className="mt-1">
                                    <textarea
                                        value={form.note}
                                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                                        placeholder="Catatan (opsional)"
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detail Barang Table */}
                <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Detail Barang</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left">Nama Barang</th>
                                    <th className="px-4 py-2 text-center">Stok Tersedia</th>
                                    <th className="px-4 py-2 text-center">Diminta</th>
                                    <th className="px-4 py-2 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {/* Existing Items */}
                                {updateData.details?.map((detail) => (
                                    <tr key={detail.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                            <div className="flex items-center">
                                                {detail.product?.image_url ? (
                                                    <img
                                                        src={detail.product.image_url}
                                                        alt={detail.product?.name}
                                                        className="w-9 h-9 object-cover rounded mr-3"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextElementSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 bg-gray-200 rounded mr-3 flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-gray-500" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium">{detail.product?.name}</div>
                                                    <div className="text-xs text-gray-500">SKU: {detail.product?.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`font-medium ${detail.product?.stock_quantity <= 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                                {detail.product?.stock_quantity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <input
                                                type="number"
                                                value={updatedDetails.find(d => d.id === detail.id)?.requested_quantity || detail.requested_quantity}
                                                onChange={(e) => handleUpdateQuantity(detail.id, parseInt(e.target.value) || 1)}
                                                min="1"
                                                max={detail.product?.stock_quantity}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                onClick={() => handleRemoveItem(detail.id)}
                                                className="p-1 text-red-600 hover:text-red-800"
                                                title="Hapus item"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {/* New Item Row - Hanya tampilkan jika ada products */}
                                {products.length > 0 && (
                                    <tr className="hover:bg-gray-50 bg-gray-50">
                                        <td className="px-4 py-2">
                                            <div className="flex items-center">
                                                <div className="w-9 h-9 bg-gray-200 rounded mr-3 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-gray-500" />
                                                </div>
                                                <select
                                                    value={form.product_id}
                                                    onChange={(e) => {
                                                        const selectedProduct = products.find(p => p.id === parseInt(e.target.value));
                                                        if (selectedProduct) {
                                                            setForm({
                                                                ...form,
                                                                product_id: e.target.value,
                                                                quantity: 1
                                                            });
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="">-- Pilih Produk Baru --</option>
                                                    {products
                                                        .filter(product =>
                                                            // Filter produk yang belum ada di details dan stok > 0
                                                            !updateData.details?.some(detail => detail.product_id === product.id) &&
                                                            product.stock_quantity > 0
                                                        )
                                                        .map((product) => (
                                                            <option
                                                                key={product.id}
                                                                value={product.id}
                                                            >
                                                                {product.name} - {product.sku} (Stock: {product.stock_quantity})
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {form.product_id ? (
                                                <span className="font-medium text-gray-700">
                                                    {products.find(p => p.id === parseInt(form.product_id))?.stock_quantity || 0}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <input
                                                type="number"
                                                value={form.quantity}
                                                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                                                min="1"
                                                max={form.product_id ? products.find(p => p.id === parseInt(form.product_id))?.stock_quantity : 1}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                onClick={handleAddItemToRequest}
                                                disabled={!form.product_id || form.quantity < 1 || loading}
                                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                                            >
                                                Tambah
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Loading state untuk products */}
                    {products.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                            Loading products...
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={() => handleSubmitUpdate('draft')}
                        disabled={loading || updateData.details?.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Menyimpan...' : 'Simpan Draft'}
                    </button>
                    <button
                        onClick={handleSubmitFromUpdateModal}
                        disabled={loading || updateData.details?.length === 0 ||
                            updateData.details?.some(detail => {
                                const product = products.find(p => p.id === detail.product_id);
                                const requestedQty = updatedDetails.find(ud => ud.id === detail.id)?.requested_quantity || detail.requested_quantity;
                                return product && requestedQty > product.stock_quantity;
                            })
                        }
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Mengirim...' : 'Kirim Request'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RequestUpdateModal;