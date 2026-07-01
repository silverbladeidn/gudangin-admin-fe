import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Package, Save, X, Upload, Image, Loader } from 'lucide-react';
import axios from 'axios';

const AddInventory = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        category_id: "",
        sku: "",
        stock_quantity: "",
        price: "",
        cost_price: "",
        min_stock_level: "",
        max_stock_level: "",
        description: "",
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await axios.get('http://127.0.0.1:8000/api/categories');
            const categoriesData = response.data?.data || response.data || [];
            setCategories(categoriesData);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setImageFile(null);
            setImagePreview(null);
            return;
        }

        console.log('📁 File selected from input:', {
            name: file.name,
            size: file.size,
            type: file.type,
            isFile: file instanceof File,
            constructor: file.constructor.name
        });

        // Validasi file
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Format file tidak didukung. Gunakan JPEG, PNG, JPG, GIF, atau WebP.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('Ukuran file terlalu besar. Maksimal 10MB.');
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));

        console.log('✅ File state updated');
    };

    const removeImage = () => {
        setImagePreview(null);
        setImageFile(null);
        document.getElementById('image-upload').value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value);
            });

            if (imageFile) {
                data.append('images', imageFile);
            }

            const token = localStorage.getItem('auth_token');
            console.log('🔐 Token:', token);

            // TEST DENGAN URL LANGSUNG
            const response = await fetch('http://127.0.0.1:8000/api/products', {
                method: 'POST',
                body: data,
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                mode: 'cors', // ← EXPLICITLY SET CORS MODE
                credentials: 'omit'
            });

            console.log('📨 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Response error:', errorText);
                throw new Error(errorText);
            }

            const result = await response.json();
            console.log('✅ Success:', result);
            navigate('/inventory');

        } catch (error) {
            console.error('❌ Detailed fetch error:', error);

            if (error.message.includes('Failed to fetch')) {
                alert('Koneksi gagal. Pastikan server Laravel berjalan dan CORS dienable.');
            } else {
                try {
                    const errorData = JSON.parse(error.message);
                    setErrors(errorData.errors || {});
                } catch {
                    alert('Error: ' + error.message);
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Yakin ingin membatalkan? Semua perubahan akan hilang.')) {
            navigate('/inventory');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/inventory"
                        className="inline-flex items-center text-gray-600 rounded-lg px-3 py-1 hover:bg-green-400 hover:text-black mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Inventori
                    </Link>

                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <h1 className="text-3xl font-bold text-gray-900">Tambah Barang Baru</h1>
                            <p className="text-gray-600 mt-1">Isi detail untuk menambahkan barang baru ke inventori</p>
                        </div>
                    </div>
                </div>

                {/* Errors Display */}
                {Object.keys(errors).length > 0 && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <h4 className="text-red-800 font-medium mb-2">Kesalahan Validasi:</h4>
                        <ul className="text-red-700 text-sm space-y-1">
                            {Object.entries(errors).map(([field, message]) => (
                                <li key={field}>• {field}: {message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {imageFile && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
                        <h4 className="text-green-800 font-medium mb-2">File siap diupload:</h4>
                        <p className="text-green-700 text-sm">
                            📁 {imageFile.name} <br />
                            📦 {(imageFile.size / 1024).toFixed(2)} KB <br />
                            🖼️ {imageFile.type}
                        </p>
                    </div>
                )}

                {/* Main Form */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                        <div className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column - Product Image */}
                                <div className="lg:col-span-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Gambar Barang</h3>

                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors">
                                        {imagePreview ? (
                                            <div className="relative">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="w-full h-48 object-cover rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-500 mb-2">Upload gambar barang</p>
                                                <p className="text-xs text-gray-400">PNG, JPG, JPEG, GIF, WebP maksimal 10MB</p>
                                            </div>
                                        )}

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <label
                                            htmlFor="image-upload"
                                            className="mt-4 inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-200 hover:text-black cursor-pointer transition-colors"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            {imagePreview ? 'Ganti Gambar' : 'Pilih Gambar'}
                                        </label>
                                    </div>
                                </div>

                                {/* Right Column - Product Details */}
                                <div className="lg:col-span-2 space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Detail Barang</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Product Name */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nama Barang *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${errors.name ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Masukkan nama barang"
                                            />
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                        </div>

                                        {/* Category */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Kategori *
                                            </label>
                                            <select
                                                name="category_id"
                                                value={formData.category_id}
                                                onChange={handleInputChange}
                                                disabled={loadingCategories}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${errors.category_id ? 'border-red-500' : 'border-gray-300'
                                                    } ${loadingCategories ? 'bg-gray-100' : ''}`}
                                            >
                                                <option value="">
                                                    {loadingCategories ? 'Memuat kategori...' : 'Pilih kategori'}
                                                </option>
                                                {Array.isArray(categories) && categories.map(category => (
                                                    <option key={category.id || category} value={category.id || category}>
                                                        {category.name || category}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                                        </div>

                                        {/* SKU */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                SKU *
                                            </label>
                                            <input
                                                autoFocus
                                                type="text"
                                                name="sku"
                                                value={formData.sku}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${errors.sku ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Masukkan SKU"
                                            />
                                            {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
                                        </div>

                                        {/* Stock Quantity */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Jumlah Stok *
                                            </label>
                                            <input
                                                type="number"
                                                name="stock_quantity"
                                                value={formData.stock_quantity}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${errors.stock_quantity ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Masukkan jumlah"
                                                min="0"
                                            />
                                            {errors.stock_quantity && <p className="text-red-500 text-sm mt-1">{errors.stock_quantity}</p>}
                                        </div>

                                        {/* Price */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Harga Jual (IDR) *
                                            </label>
                                            <input
                                                type="number"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${errors.price ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Masukkan harga jual"
                                                min="0"
                                                step="0.01"
                                            />
                                            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                                        </div>

                                        {/* Cost Price */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Harga Modal (IDR) <span className="text-gray-400">(opsional)</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="cost_price"
                                                value={formData.cost_price}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${errors.cost_price ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Masukkan harga modal"
                                                min="0"
                                                step="0.01"
                                            />
                                            {errors.cost_price && <p className="text-red-500 text-sm mt-1">{errors.cost_price}</p>}
                                        </div>

                                        {/* Minimum Stock */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Stok Minimum
                                            </label>
                                            <input
                                                type="number"
                                                name="min_stock_level"
                                                value={formData.min_stock_level}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                                                placeholder="Masukkan stok minimum"
                                                min="0"
                                            />
                                        </div>

                                        {/* Maximum Stock Level */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Stok Maksimum
                                            </label>
                                            <input
                                                type="number"
                                                name="max_stock_level"
                                                value={formData.max_stock_level}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                                                placeholder="Masukkan stok maksimum"
                                                min="0"
                                            />
                                        </div>

                                        {/* Description */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Deskripsi
                                            </label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                rows={4}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                                                placeholder="Masukkan deskripsi barang..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="bg-gray-50 px-8 py-6 flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
                                disabled={submitting}
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {submitting ? (
                                    <>
                                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                                        Menambahkan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Tambah Barang
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddInventory;