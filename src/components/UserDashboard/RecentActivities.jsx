import React from 'react';
import { Activity } from 'lucide-react';

export default function RecentActivities({ recentActivities, getTimeAgo }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Activity className="w-5 h-5 text-purple-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Aktivitas Terkini
                    </h3>
                </div>
                <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                    Lihat Semua
                </button>
            </div>
            <div className="space-y-3">
                {recentActivities.slice(0, 5).map(activity => (
                    <div key={activity.id} className="flex items-start space-x-3 py-2">
                        <div
                            className={`p-1 rounded-full ${activity.color === 'text-green-600'
                                    ? 'bg-green-100'
                                    : activity.color === 'text-blue-600'
                                        ? 'bg-blue-100'
                                        : activity.color === 'text-yellow-600'
                                            ? 'bg-yellow-100'
                                            : activity.color === 'text-purple-600'
                                                ? 'bg-purple-100'
                                                : 'bg-red-100'
                                }`}
                        >
                            <activity.icon className={`w-3 h-3 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {getTimeAgo(activity.timestamp)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
