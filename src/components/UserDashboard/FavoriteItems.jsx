import React from 'react';
import { Heart, Package, Zap, ArrowRight, Plus } from 'lucide-react';
import QuickRequestButtons from "./QuickRequestButtons";

export default function FavoriteItems({
    favoriteItems,
    products,
    handleQuickRequest
}) {
    return (
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Heart className="w-5 h-5 text-red-500 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900">
                        Barang Favorit & Sering Digunakan
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favoriteItems.map(item => (
                    <div
                        key={item.id}
                        className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shadow-sm">
                                {item.image_url ? (
                                    <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-6 h-6 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 truncate">
                                    {item.name}
                                </h3>
                                <div className="flex items-center space-x-2 mt-1">
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.status === 'in_stock'
                                            ? 'bg-green-100 text-green-800'
                                            : item.status === 'low_stock'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {item.stock_quantity} unit
                                    </span>
                                    <span className="text-xs text-gray-500">SKU: {item.sku}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleQuickRequest(item)}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Zap className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <QuickRequestButtons
                products={products}
                onQuickRequest={handleQuickRequest}
            />

        </div>
    );
}
