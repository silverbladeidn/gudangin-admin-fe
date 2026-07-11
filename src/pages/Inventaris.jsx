import React, { useEffect, useState } from "react";
import axios from "axios";

const Inventaris = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [barcodeSize, setBarcodeSize] = useState({ width: 100, height: 40 });
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [requestItems, setRequestItems] = useState({});
  const [showNoteSection, setShowNoteSection] = useState(false);
  const [userRequests, setUserRequests] = useState([]);
  const [loadingAction, setLoadingAction] = useState(null);
  const [requestNote, setRequestNote] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState({
    category: "all",
    priceMin: "",
    priceMax: "",
    stockMin: "",
    stockMax: "",
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://127.0.0.1:8000/api/products");
      console.log("API result:", response.data);

      if (Array.isArray(response.data.data?.data)) {
        setInventoryItems(response.data.data.data);
      } else if (Array.isArray(response.data.data)) {
        setInventoryItems(response.data.data);
      } else {
        setInventoryItems([]);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Gagal mengambil data produk");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRequests = async () => {
    try {
      const token =
        localStorage.getItem("auth_token") || localStorage.getItem("token");

      if (!token) {
        console.log("No token found, skipping request history fetch");
        return;
      }

      const response = await axios.get(
        "http://127.0.0.1:8000/api/item-requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (response.data.success) {
        setUserRequests(response.data.data.data || response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching user requests:", error);
      // Don't show error for request history as it's optional
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchUserRequests(); // Also fetch user's request history
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setBarcodeSize({ width: 80, height: 30 });
      } else {
        setBarcodeSize({ width: 100, height: 40 });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const handleQuantityChange = (itemId, quantity) => {
    const numQuantity = parseInt(quantity) || 0;
    if (numQuantity > 0) {
      setRequestItems((prev) => ({
        ...prev,
        [itemId]: numQuantity,
      }));
    } else {
      setRequestItems((prev) => {
        const newRequestItems = { ...prev };
        delete newRequestItems[itemId];
        return newRequestItems;
      });
    }
  };

  const handleSubmitRequest = async (action = "submit") => {
    const itemsToRequest = Object.entries(requestItems).filter(
      ([id, quantity]) => quantity > 0,
    );

    if (itemsToRequest.length === 0) {
      alert("Silakan pilih barang dan masukkan jumlah yang ingin di-request");
      return;
    }

    // Kalau mau note dulu, tetap jalan seperti sebelumnya
    if (!showNoteSection && action === "submit") {
      setShowNoteSection(true);
      return;
    }

    try {
      setLoading(true);

      const requestData = {
        action, // <---- kirim ke backend
        note: requestNote || "",
        details: itemsToRequest.map(([productId, quantity]) => ({
          product_id: parseInt(productId),
          qty: parseInt(quantity),
        })),
      };

      const token =
        localStorage.getItem("auth_token") || localStorage.getItem("token");
      if (!token) {
        alert("Anda belum login. Silakan login terlebih dahulu.");
        return;
      }

      const response = await axios.post(
        "http://127.0.0.1:8000/api/item-requests",
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (response.data.success) {
        alert(`Request ${action === "draft" ? "draft" : "berhasil dikirim"}!
            
Request Number: ${response.data.data.request_number}
Total Items: ${itemsToRequest.length} jenis barang
Status: ${action === "draft" ? "Draft" : response.data.data.status}`);

        setRequestItems({});
        setRequestNote("");
        setShowNoteSection(false);
        fetchProducts();
        fetchUserRequests();
      } else {
        alert(
          "Gagal mengirim request: " +
            (response.data.message || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Request error:", error);
      let errorMessage = "Gagal mengirim request";
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401)
          errorMessage = "Sesi login telah berakhir. Silakan login kembali.";
        else if (status === 422)
          errorMessage = data.errors
            ? Object.values(data.errors).flat().join("\n")
            : data.message || "Data tidak valid";
        else if (status === 500) errorMessage = data.message || "Server error.";
        else errorMessage = data.message || `Error ${status}`;
      } else if (error.request) {
        errorMessage = "Tidak dapat terhubung ke server.";
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

  const categories = [
    ...new Set(
      inventoryItems.map((item) => item.category?.name).filter(Boolean),
    ),
  ];

  const totalRequestItems = Object.keys(requestItems).length;

  if (loading && inventoryItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manajemen Inventaris
          </h1>
          <p className="text-gray-600 mt-1">
            Tempat mengatur segala permintaan barang per ruangan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            className="px-4 py-2 border font-medium text-white bg-green-500 border-gray-300 rounded-xl hover:bg-green-700 transition-colors"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col gap-4">
          {/* Main search and filter row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
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
                className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Filter Lanjutan
              </button>

              {/* Tombol Simpan Draft */}
              <button
                onClick={() => handleSubmitRequest("draft")}
                className={`px-6 py-2 rounded-xl text-white font-medium transition-colors ${
                  totalRequestItems > 0 && !loading
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                disabled={totalRequestItems === 0 || loading}
              >
                {loadingAction === "draft" ? "Menyimpan..." : "Simpan Draft"}
              </button>

              {/* Tombol Kirim Request */}
              <button
                onClick={() => handleSubmitRequest("submit")}
                className={`px-6 py-2 rounded-xl text-white font-medium transition-colors ${
                  totalRequestItems > 0 && !loading
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                disabled={totalRequestItems === 0 || loading}
              >
                {loadingAction === "submit"
                  ? "Processing..."
                  : `Request Barang ${totalRequestItems > 0 ? `(${totalRequestItems})` : ""}`}
              </button>

              {showNoteSection && (
                <button
                  onClick={() => {
                    setShowNoteSection(false);
                    setRequestNote("");
                  }}
                  className="px-4 py-2 border bg-red-500 border-gray-300 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                >
                  Batal
                </button>
              )}
            </div>
          </div>

          {/* Note Section */}
          {showNoteSection && (
            <div className="border-t pt-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Tambahkan Catatan Request
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Berikan deskripsi atau catatan tambahan untuk request barang
                  ini:
                </p>
                <textarea
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="Contoh: Untuk kebutuhan ruang meeting lantai 2, urgent diperlukan besok pagi..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows="4"
                />
                <div className="mt-3 text-sm text-gray-500">
                  <strong>Items yang akan di-request:</strong>
                  <ul className="mt-1 space-y-1">
                    {Object.entries(requestItems).map(([itemId, quantity]) => {
                      const item = inventoryItems.find(
                        (i) => i.id.toString() === itemId,
                      );
                      return item ? (
                        <li key={itemId} className="text-gray-600">
                          • {item.name} - Jumlah: {quantity}
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* Kategori */}
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

                {/* Harga Min */}
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

                {/* Harga Max */}
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

                {/* Stok Min */}
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

                {/* Stok Max */}
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
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Ulang Filtering
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white shadow-md rounded-xl p-4 flex flex-col justify-between"
          >
            <div>
              <img
                src={item.image_url || "https://via.placeholder.com/150"}
                alt={item.name}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <p className="text-sm text-gray-600">SKU: {item.sku}</p>
              <p className="text-sm text-gray-600">
                Tipe: {item.category?.name}
              </p>
              <p className="text-sm text-gray-600">
                Harga Satuan: {formatPrice(item.price)}
              </p>
              <p
                className={`mt-2 font-medium ${
                  item.stock_quantity > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {item.stock_quantity > 0
                  ? `Stok: ${item.stock_quantity}`
                  : "Stok Habis"}
              </p>
            </div>

            {/* Quantity Input */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Request:
              </label>
              <input
                type="number"
                min="0"
                max={item.stock_quantity}
                value={requestItems[item.id] || ""}
                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                disabled={
                  item.stock_quantity <= 0 || item.status === "out_of_stock"
                }
                placeholder={
                  item.stock_quantity <= 0 || item.status === "out_of_stock"
                    ? "Stok habis"
                    : "0"
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  item.stock_quantity <= 0 || item.status === "out_of_stock"
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500"
                    : "border-gray-300 focus:ring-green-500"
                }`}
              />
              {(item.stock_quantity <= 0 || item.status === "out_of_stock") && (
                <p className="text-xs text-red-500 mt-1">
                  Barang tidak tersedia untuk di-request
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inventaris;
