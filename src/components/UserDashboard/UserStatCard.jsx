import React from 'react';

export default function UserStatCard({ title, value, color, icon: Icon }) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        purple: 'bg-purple-100 text-purple-600',
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center">
            <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="ml-4">
                <p className="text-gray-500 text-sm">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}
