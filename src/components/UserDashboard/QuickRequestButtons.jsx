import React from "react";
import { Link } from 'react-router-dom';
import { Plus, ArrowRight } from "lucide-react";

export default function QuickRequestButtons({ products, onQuickRequest }) {
    return (
        <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Minta Cepat</h3>
                <Link
                    to="/inventaris"
                    className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center">
                    Lihat Semua <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
                {products.slice(0, 5).map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onQuickRequest(item)}
                        className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition-colors"
                    >
                        <Plus className="w-3 h-3 inline mr-1" />
                        Minta {item.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
