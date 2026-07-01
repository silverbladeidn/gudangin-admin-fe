import React from 'react';
import { X, Minus, Plus } from 'lucide-react';

export default function RequestModal({
    selectedItem,
    requestQuantity,
    setRequestQuantity,
    requestNote,
    setRequestNote,
    onClose,
    onSubmit
}) {
    if (!selectedItem) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Quick Request</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-4">
                    <h4 className="font-medium text-gray-900">{selectedItem.name}</h4>
                    <p className="text-sm text-gray-600">SKU: {selectedItem.sku || 'N/A'}</p>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Request</label>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setRequestQuantity(Math.max(1, requestQuantity - 1))}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <input
                            type="number"
                            min="1"
                            value={requestQuantity}
                            onChange={(e) =>
                                setRequestQuantity(Math.max(1, parseInt(e.target.value) || 1))
                            }
                            className="w-20 text-center border rounded-lg p-2"
                        />
                        <button
                            onClick={() => setRequestQuantity(requestQuantity + 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
                    <textarea
                        value={requestNote}
                        onChange={(e) => setRequestNote(e.target.value)}
                        placeholder="Tambahkan catatan (opsional)"
                        className="w-full border rounded-lg p-2"
                        rows="3"
                    />
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onSubmit}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Kirim Request
                    </button>
                </div>
            </div>
        </div>
    );
}
