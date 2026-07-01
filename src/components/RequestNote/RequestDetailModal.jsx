import React from 'react';
import { X, Package } from 'lucide-react';

const RequestDetailModal = ({
    show,
    selectedRequest,
    onClose,
    loading,
    getStatusIcon,
    getStatusColor,
    formatDate,
    onSubmitRequest
}) => {
    if (!show || !selectedRequest) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            style={{ position: 'fixed', top: -32, left: -32, right: -32, bottom: -32 }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()} // cegah overlay close saat klik konten
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                        Detail Request: {selectedRequest.request_number}
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
                                <span className="ml-2">{selectedRequest.user?.name || 'Unknown User'}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Status:</span>
                                <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                                    {getStatusIcon(selectedRequest.status)}
                                    <span className="ml-1 capitalize">{selectedRequest.status}</span>
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Tanggal Request:</span>
                                <span className="ml-2">{formatDate(selectedRequest.created_at)}</span>
                            </div>
                            {selectedRequest.approved_at && (
                                <div>
                                    <span className="font-medium text-gray-700">Tanggal Disetujui:</span>
                                    <span className="ml-2">{formatDate(selectedRequest.approved_at)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Catatan</h4>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Catatan User:</span>
                                <div className="mt-1 p-2 bg-gray-50 rounded text-gray-600">
                                    {selectedRequest.note || 'Tidak ada catatan'}
                                </div>
                            </div>
                            {selectedRequest.admin_note && (
                                <div>
                                    <span className="font-medium text-gray-700">Catatan Admin:</span>
                                    <div className="mt-1 p-2 bg-blue-50 rounded text-gray-600">
                                        {selectedRequest.admin_note}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Details */}
                <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Detail Barang</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left">Nama Barang</th>
                                    <th className="px-4 py-2 text-center">Diminta</th>
                                    {selectedRequest.status !== 'draft' && (
                                        <th className="px-4 py-2 text-center">Disetujui</th>
                                    )}
                                    <th className="px-4 py-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {selectedRequest.details?.map((detail, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                            <div className="flex items-center">
                                                {detail.product?.image_url ? (
                                                    <img
                                                        src={
                                                            detail.product?.image_url
                                                                ? detail.product.image_url.replace(/\s*\(\d+×\d+\)/, '')
                                                                : ''
                                                        }
                                                        alt={detail.product?.name}
                                                        className="w-9 h-9 object-cover mr-3"
                                                        onError={(e) => {
                                                            console.log('Gambar gagal dimuat:', detail.product?.image_url);
                                                            e.target.style.display = 'none';
                                                            e.target.nextElementSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}

                                                <div
                                                    className="w-9 h-9 bg-gray-200 rounded mr-3 flex items-center justify-center"
                                                    style={{ display: detail.product?.image_url ? 'none' : 'flex' }}
                                                >
                                                    <Package className="w-5 h-5 text-gray-500" />
                                                </div>

                                                <div>
                                                    <div className="font-medium">
                                                        {detail.name || detail.product?.name || `Product ID: ${detail.product_id}`}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        SKU: {detail.product?.sku || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center font-medium">
                                            {detail.requested_quantity}
                                        </td>
                                        {selectedRequest.status !== 'draft' && (
                                            <td className="px-4 py-2 text-center font-medium">
                                                {detail.approved_quantity || detail.requested_quantity}
                                            </td>
                                        )}
                                        <td className="px-4 py-2 text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(detail.status || selectedRequest.status)}`}>
                                                {getStatusIcon(selectedRequest.status)}
                                                <span className="ml-1 capitalize">{detail.status || selectedRequest.status}</span>
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border bg-gray-400 border-gray-300 rounded-lg text-white hover:bg-gray-700"
                    >
                        Tutup
                    </button>
                    {selectedRequest.status === 'draft' && (
                        <button
                            onClick={onSubmitRequest}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Mengirim...' : 'Kirim Request'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestDetailModal;