import React from 'react';
import { Package, Eye, HandHelping, XCircle } from 'lucide-react';

const RequestTable = ({
    requests,
    onViewDetails,
    onUpdateRequest,
    onCancelRequest,
    onSort,
    sortField,
    sortDirection,
    getStatusIcon,
    getStatusColor,
    formatDate,
    renderSortIcon
}) => {
    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => onSort('request_number')}
                            >
                                <div className="flex items-center justify-between">
                                    Request Number
                                    {renderSortIcon('request_number')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => onSort('status')}
                            >
                                <div className="flex items-center justify-between">
                                    Status
                                    {renderSortIcon('status')}
                                </div>
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Items Requested
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Catatan
                            </th>
                            <th
                                className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => onSort('created_at')}
                            >
                                <div className="flex items-center justify-between">
                                    Tanggal
                                    {renderSortIcon('created_at')}
                                </div>
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {requests.map((item) => (
                            <tr
                                key={item.id}
                                className="hover:bg-gray-50 transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {item.request_number}
                                    </span>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                        {getStatusIcon(item.status)}
                                        <span className="ml-1 capitalize">{item.status}</span>
                                    </span>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="max-w-xs">
                                        {item.details && item.details.length > 0 ? (
                                            <div className="space-y-1">
                                                {item.details.slice(0, 3).map((detail, idx) => (
                                                    <div key={idx} className="flex items-center text-xs">
                                                        <div className="w-4 h-4 bg-green-500 rounded mr-2 flex-shrink-0 flex items-center justify-center">
                                                            <Package className="w-2 h-2 text-white" />
                                                        </div>
                                                        <span className="truncate font-medium">
                                                            {detail.name || detail.product?.name || `Product ID: ${detail.product_id}`}
                                                        </span>
                                                        <span className="ml-2 text-gray-500 flex-shrink-0">
                                                            ({detail.requested_quantity}x)
                                                        </span>
                                                    </div>
                                                ))}
                                                {item.details.length > 3 && (
                                                    <div className="text-xs text-gray-500 font-medium">
                                                        +{item.details.length - 3} item lainnya
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-500">No items</span>
                                        )}
                                    </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                    {item.note || '-'}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                    {formatDate(item.created_at)}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-2">
                                        <button
                                            onClick={() => onViewDetails(item.id)}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>

                                        {item.status === 'draft' && (
                                            <>
                                                <button
                                                    onClick={() => onUpdateRequest(item.id)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Update Request"
                                                >
                                                    <HandHelping className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onCancelRequest(item.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Cancel Request"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RequestTable;