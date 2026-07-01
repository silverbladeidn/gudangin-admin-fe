import React from "react";
import { Package, CheckCheck, Check, X } from "lucide-react";

const RequestTable = ({
  requests,
  onSort,
  getStatusIcon,
  getStatusColor,
  formatDate,
  renderSortIcon, // Tambahkan user sebagai prop
  onApprove, // DITAMBAHKAN
  onPartialApprove, // DITAMBAHKAN
  onReject, // DITAMBAHKAN
}) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  // Handle undefined data
  const safeRequests = Array.isArray(requests) ? requests : [];

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort("request_number")}
              >
                <div className="flex items-center justify-between">
                  Nomor Permintaan
                  {renderSortIcon("request_number")}
                </div>
              </th>
              <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pengguna
              </th>
              <th
                className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort("status")}
              >
                <div className="flex items-center justify-center">
                  Status
                  {renderSortIcon("status")}
                </div>
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Yang Diminta
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Catatan
              </th>
              <th
                className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort("created_at")}
              >
                <div className="flex items-center justify-between">
                  Tanggal
                  {renderSortIcon("created_at")}
                </div>
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {safeRequests.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No requests found
                </td>
              </tr>
            ) : (
              safeRequests.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.request_number}
                    </span>
                  </td>

                  <td className="px-2 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-black">
                      {item.user?.name || "N/A"}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {getStatusIcon(item.status)}
                        <span className="ml-1 capitalize">{item.status}</span>
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      {item.details && item.details.length > 0 ? (
                        <div className="space-y-1">
                          {item.details.slice(0, 3).map((detail, idx) => (
                            <div
                              key={idx}
                              className="flex items-center text-xs"
                            >
                              <div className="w-4 h-4 bg-green-500 rounded mr-2 flex-shrink-0 flex items-center justify-center">
                                <Package className="w-2 h-2 text-white" />
                              </div>
                              <span className="truncate font-medium">
                                {detail.name ||
                                  detail.product?.name ||
                                  `Product ID: ${detail.product_id}`}
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

                  <td className="px-2 py-3 text-sm text-gray-600 text-center truncate max-w-[10rem]">
                    {item.note || "-"}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      {formatDate(item.created_at)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center space-x-2">
                      {/* Tombol Partial Approve untuk Admin */}
                      {user && user.role === "Admin" && (
                        <button
                          onClick={() => onPartialApprove(item.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Partially Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {/* Tombol Approve untuk Superadmin */}
                      {user && user.role === "Superadmin" && (
                        <button
                          onClick={() => onApprove(item.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Approve"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      )}

                      {/* Tombol Reject untuk semua */}
                      <button
                        onClick={() => onReject(item.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestTable;
