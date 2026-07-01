import React from 'react';
import { Star } from 'lucide-react';

export default function PopularProducts({ popularProducts }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center mb-4">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Produk Terpopuler</h3>
            </div>
            <div className="space-y-3">
                {popularProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                    #{index + 1}
                                </span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 text-sm">
                                    {product.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {product.requests} request
                                </p>
                            </div>
                        </div>
                        <span className="text-green-600 text-xs font-medium">
                            {product.growth}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
