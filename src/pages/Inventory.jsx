import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { API_URL } from "../api/axios";
import {
  Plus,
  Archive,
  Filter,
  FileSpreadsheet,
  File,
  Edit,
  Trash2,
  Search,
  Package,
  AlertTriangle,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hovered, setHovered] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

  // Advanced filters
  const [advancedFilters, setAdvancedFilters] = useState({
    category: "all",
    priceMin: "",
    priceMax: "",
    stockMin: "",
    stockMax: "",
  });

  const BarcodeImage = ({ productId, sku }) => {
    const [barcodeUrl, setBarcodeUrl] = useState(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
      let objectUrl;
      const loadBarcode = async () => {
        try {
          const res = await fetch(`${API_URL}/products/${productId}/barcode`, {
            headers: { "ngrok-skip-browser-warning": "true" },
          });
          if (!res.ok) throw new Error("Failed");
          const blob = await res.blob();
          objectUrl = URL.createObjectURL(blob);
          setBarcodeUrl(objectUrl);
        } catch (err) {
          setFailed(true);
        }
      };
      loadBarcode();
      return () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
    }, [productId]);

    if (failed) return null;
    return barcodeUrl ? (
      <img src={barcodeUrl} alt={`Barcode ${sku}`} className="h-10" />
    ) : null;
  };

  // Fungsi untuk mengambil data dari API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/products");
      console.log("API result:", response.data);

      // Jika pakai pagination
      if (Array.isArray(response.data.data?.data)) {
        setInventoryItems(response.data.data.data);
      }
      // Jika langsung array
      else if (Array.isArray(response.data.data)) {
        setInventoryItems(response.data.data);
      } else {
        setInventoryItems([]);
      }

      setError(null);
    } catch (err) {
      setError("Gagal mengambil data produk");
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Panggil fetchProducts saat komponen dimount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Get sorted data
  const getSortedData = (data) => {
    return [...data].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "id":
          aValue = parseInt(a.id);
          bValue = parseInt(b.id);
          break;
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "category":
          aValue = a.category?.name?.toLowerCase() || "";
          bValue = b.category?.name?.toLowerCase() || "";
          break;
        case "stock":
          aValue = a.stock_quantity;
          bValue = b.stock_quantity;
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setAdvancedFilters({
      category: "all",
      priceMin: "",
      priceMax: "",
      stockMin: "",
      stockMax: "",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "in_stock":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "low_stock":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "out_of_stock":
        return <Package className="w-4 h-4 text-red-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "in_stock":
        return "bg-green-100 text-green-800";
      case "low_stock":
        return "bg-yellow-100 text-yellow-800";
      case "out_of_stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Tampilkan loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Tampilkan error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Tambahkan fungsi untuk handle delete
  const handleDelete = async (productId) => {
    // Konfirmasi dengan dialog browser
    if (window.confirm("Yakin ingin menghapus produk ini?")) {
      try {
        // Simpan state lama untuk rollback jika gagal
        const previousItems = [...inventoryItems];

        // Update state langsung (optimistic update)
        setInventoryItems(
          inventoryItems.filter((item) => item.id !== productId),
        );

        // Panggil API
        await api.delete(`/products/${productId}`);
      } catch (error) {
        // Jika gagal, kembalikan state ke sebelumnya
        console.error("Error deleting product:", error);
        setInventoryItems(previousItems);
        alert("Failed to delete product");
      }
    }
  };

  // Filter data berdasarkan search, status, dan advanced filters
  const filteredItems = getSortedData(
    inventoryItems.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || item.status === filterStatus;
      const matchesCategory =
        advancedFilters.category === "all" ||
        item.category?.name === advancedFilters.category;
      const matchesPriceMin =
        !advancedFilters.priceMin ||
        item.price >= parseInt(advancedFilters.priceMin);
      const matchesPriceMax =
        !advancedFilters.priceMax ||
        item.price <= parseInt(advancedFilters.priceMax);
      const matchesStockMin =
        !advancedFilters.stockMin ||
        item.stock_quantity >= parseInt(advancedFilters.stockMin);
      const matchesStockMax =
        !advancedFilters.stockMax ||
        item.stock_quantity <= parseInt(advancedFilters.stockMax);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesPriceMin &&
        matchesPriceMax &&
        matchesStockMin &&
        matchesStockMax
      );
    }),
  );

  // Get unique categories for filter dropdown
  const categories = [
    ...new Set(
      inventoryItems.map((item) => item.category?.name).filter(Boolean),
    ),
  ];

  // Render sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <div className="w-4 h-4"></div>;
    }
    return sortDirection === "desc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manajemen Inventori
          </h1>
          <p className="text-gray-600 mt-1">
            Tempat mengatur segala jumlah barang dan jenis barang di
            penyimpanan.
          </p>
        </div>
        <Link
          to="/inventory/add"
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 no-underline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col gap-4">
          {/* Main search and filter row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari barang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Semua Status</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter Lanjutan
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={advancedFilters.category}
                    onChange={(e) =>
                      setAdvancedFilters({
                        ...advancedFilters,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">Semua Kategori</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Minimum
                  </label>
                  <input
                    type="number"
                    placeholder="Harga Minimum"
                    value={advancedFilters.priceMin}
                    onChange={(e) =>
                      setAdvancedFilters({
                        ...advancedFilters,
                        priceMin: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Maksimum
                  </label>
                  <input
                    type="number"
                    placeholder="Harga Maksimum"
                    value={advancedFilters.priceMax}
                    onChange={(e) =>
                      setAdvancedFilters({
                        ...advancedFilters,
                        priceMax: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok Minimum
                  </label>
                  <input
                    type="number"
                    placeholder="Stok Minimum"
                    value={advancedFilters.stockMin}
                    onChange={(e) =>
                      setAdvancedFilters({
                        ...advancedFilters,
                        stockMin: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok Maksimum
                  </label>
                  <input
                    type="number"
                    placeholder="Stok Maksimum"
                    value={advancedFilters.stockMax}
                    onChange={(e) =>
                      setAdvancedFilters({
                        ...advancedFilters,
                        stockMax: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={clearFilters}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Ulang Filtering
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center justify-between">
                    Id
                    {renderSortIcon("id")}
                  </div>
                </th>
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    Gambar
                  </div>
                </th>
                <th
                  className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center justify-between">
                    Nama Barang
                    {renderSortIcon("name")}
                  </div>
                </th>
                <th
                  className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("sku")}
                >
                  <div className="flex items-center">
                    SKU / Barcode
                    {renderSortIcon("sku")}
                  </div>
                </th>
                <th
                  className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center justify-between">
                    Kategori
                    {renderSortIcon("category")}
                  </div>
                </th>
                <th
                  className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("stock")}
                >
                  <div className="flex items-center justify-between">
                    Stok
                    {renderSortIcon("stock")}
                  </div>
                </th>
                <th
                  className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center justify-between">
                    Harga
                    {renderSortIcon("price")}
                  </div>
                </th>
                <th
                  className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center justify-between">
                    Status
                    {renderSortIcon("status")}
                  </div>
                </th>
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-between">Aksi</div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-1 py-2 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.id}
                    </span>
                  </td>
                  <td className="px-1 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-400">Gambar Kosong</span>
                      )}
                    </div>
                  </td>
                  <td className="px-1 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {item.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col items-center">
                      {item.sku ? (
                        <>
                          <BarcodeImage productId={item.id} sku={item.sku} />
                          <span className="text-xs text-gray-500 mt-1">
                            {item.sku}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">No SKU</span>
                      )}
                    </div>
                  </td>
                  <td className="px-1 py-2 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.category?.name ?? "No Category"}
                    </span>
                  </td>
                  <td className="px-1 py-2 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      {item.stock_quantity} unit
                      {item.stock_quantity <= 10 && item.stock_quantity > 0 && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-1 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatPrice(item.price)}
                  </td>
                  <td className="px-1 py-2 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                    >
                      {getStatusIcon(item.status)}
                      <span className="ml-1">{item.status}</span>
                    </span>
                  </td>
                  <td className="px-1 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-start space-x-2">
                      <div className="relative">
                        <Link
                          to={`/inventory/edit/${item.id}`}
                          onMouseEnter={() =>
                            setHovered({ id: item.id, type: "edit" })
                          }
                          onMouseLeave={() => setHovered(null)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {hovered &&
                          hovered.id === item.id &&
                          hovered.type === "edit" && (
                            <div className="absolute -top-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                              Edit
                            </div>
                          )}
                      </div>

                      <div className="relative">
                        <Link
                          to={`/inventory/edit/${item.id}/stock`}
                          onMouseEnter={() =>
                            setHovered({ id: item.id, type: "stock" })
                          }
                          onMouseLeave={() => setHovered(null)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Archive className="w-4 h-4" />
                        </Link>

                        {hovered &&
                          hovered.id === item.id &&
                          hovered.type === "stock" && (
                            <div className="absolute -top-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                              Ubah Stok
                            </div>
                          )}
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => handleDelete(item.id)}
                          onMouseEnter={() =>
                            setHovered({ id: item.id, type: "delete" })
                          }
                          onMouseLeave={() => setHovered(null)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {hovered &&
                          hovered.id === item.id &&
                          hovered.type === "delete" && (
                            <div className="absolute -top-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                              Hapus
                            </div>
                          )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredItems.length} of {inventoryItems.length} products
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <button className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
              1
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              2
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
