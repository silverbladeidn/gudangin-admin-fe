import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function LowStockAlert({ lowStockItems }) {
    if (!lowStockItems.length) return null;

    return (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
            <div className="flex items-start">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1 mr-3" />
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                        Peringatan Stok Menipis
                    </h3>
                    <p className="text-yellow-700 mb-3">
                        {lowStockItems.length} barang memiliki stok di bawah batas minimum
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {lowStockItems.map(item => (
                            <span
                                key={item.id}
                                className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                            >
                                {item.name} ({item.stock_quantity} tersisa)
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
