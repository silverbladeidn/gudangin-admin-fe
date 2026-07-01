import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Save, X, Upload, Image, Loader } from 'lucide-react';

const UpdateInventory = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        sku: '',
        price: '',
        cost_price: '',
        min_stock_level: '',
        max_stock_level: '',
        category_id: '',
        status: 'active',
        is_active: true
    });

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [currentImage, setCurrentImage] = useState(null);
    const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
    const [errors, setErrors] = useState({});

    // Cek authentication terlebih dahulu
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            alert('Silakan login terlebih dahulu');
            navigate('/login');
            return;
        }
        setIsAuthenticated(true);
    }, [navigate]);

    // Jalankan fetch data hanya jika sudah authenticated
    useEffect(() => {
        if (isAuthenticated && id) {
            fetchCategories();
            fetchProductData();
        }
    }, [id, isAuthenticated]);

    const fetchProductData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');

            const response = await fetch(`http://127.0.0.1:8000/api/products/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    alert('Session expired. Silakan login kembali.');
                    navigate('/login');
                    return;
                }
                if (response.status === 404) {
                    alert('Produk tidak ditemukan');
                    navigate('/inventory');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const product = result.data || result;

            setFormData({
                name: product.name || '',
                slug: product.slug || '',
                description: product.description || '',
                sku: product.sku || '',
                price: product.price || '',
                cost_price: product.cost_price || '',
                min_stock_level: product.min_stock_level || '',
                max_stock_level: product.max_stock_level || '',
                category_id: product.category_id || '',
                status: product.status || 'active',
                is_active: product.is_active !== undefined ? product.is_active : true
            });

            if (product.images) {
                const imageUrl = product.images.startsWith('http')
                    ? product.images
                    : `http://127.0.0.1:8000/storage/${product.images}`;
                setCurrentImage(imageUrl);
                setImagePreview(imageUrl);
            }

            setRemoveCurrentImage(false);

        } catch (error) {
            console.error('Error fetching product:', error);
            alert('Gagal memuat data produk');
            navigate('/inventory');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const token = localStorage.getItem('auth_token');

            const response = await fetch('http://127.0.0.1:8000/api/categories', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    alert('Session expired. Silakan login kembali.');
                    navigate('/login');
                    return;
                }
                // Try fallback endpoint
                const fallbackResponse = await fetch('http://127.0.0.1:8000/api/products/categories', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                });

                if (fallbackResponse.ok) {
                    const fallbackResult = await fallbackResponse.json();
                    setCategories(fallbackResult.data || fallbackResult || []);
                    return;
                }

                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setCategories(result.data || result || []);

        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
            alert('Gagal memuat data kategori');
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
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('Ukuran file terlalu besar. Maksimal 10MB.');
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert('File harus berupa gambar.');
                return;
            }

            setImageFile(file);
            setRemoveCurrentImage(false);

            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const cancelNewImage = () => {
        setImageFile(null);
        if (currentImage && !removeCurrentImage) {
            setImagePreview(currentImage);
        } else {
            setImagePreview(null);
        }
    };

    const handleRemoveCurrentImage = () => {
        setRemoveCurrentImage(true);
        setCurrentImage(null);

        if (imageFile) {
            // Jika ada file baru, tampilkan preview file baru
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(imageFile);
        } else {
            setImagePreview(null);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Nama produk wajib diisi';
        if (!formData.category_id) newErrors.category_id = 'Kategori wajib dipilih';
        if (!formData.sku.trim()) newErrors.sku = 'SKU wajib diisi';
        if (!formData.price || parseFloat(formData.price) <= 0) {
            newErrors.price = 'Harga jual harus valid dan lebih dari 0';
        }
        if (!formData.cost_price || parseFloat(formData.cost_price) <= 0) {
            newErrors.cost_price = 'Harga modal harus valid dan lebih dari 0';
        }
        if (parseFloat(formData.cost_price) > parseFloat(formData.price)) {
            newErrors.cost_price = 'Harga modal tidak boleh lebih besar dari harga jual';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            alert('Mohon periksa kembali form yang diisi.');
            return;
        }

        try {
            setSubmitting(true);
            const token = localStorage.getItem('auth_token');

            const submitData = new FormData();
            const slug = formData.slug || formData.name.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-');

            // Append form fields
            submitData.append('name', formData.name.trim());
            submitData.append('slug', slug);
            submitData.append('description', formData.description.trim() || '');
            submitData.append('sku', formData.sku.trim());
            submitData.append('price', parseFloat(formData.price).toString());
            submitData.append('cost_price', parseFloat(formData.cost_price).toString());
            submitData.append('min_stock_level', parseInt(formData.min_stock_level || 0).toString());
            submitData.append('max_stock_level', parseInt(formData.max_stock_level || 9999).toString());
            submitData.append('category_id', formData.category_id.toString());
            submitData.append('status', formData.status);
            submitData.append('is_active', formData.is_active ? '1' : '0');

            // Method override untuk Laravel
            submitData.append('_method', 'PUT');

            // Handle gambar
            if (imageFile) {
                submitData.append('images', imageFile);
            }

            // Handle hapus gambar existing
            if (removeCurrentImage && !imageFile) {
                submitData.append('remove_image', '1');
            }

            // Debug log
            console.log('Submitting data:');
            for (let [key, value] of submitData.entries()) {
                console.log(`${key}:`, value);
            }

            const response = await fetch(`http://127.0.0.1:8000/api/products/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    // JANGAN tambahkan Content-Type, biarkan browser set otomatis untuk FormData
                },
                body: submitData
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    alert('Session expired. Silakan login kembali.');
                    navigate('/login');
                    return;
                }

                if (response.status === 422 && result.errors) {
                    // Handle validation errors
                    const backendErrors = {};
                    Object.keys(result.errors).forEach(key => {
                        backendErrors[key] = result.errors[key][0];
                    });
                    setErrors(backendErrors);

                    console.log('Validation errors:', result.errors);
                    alert('Ada kesalahan validasi. Periksa form di atas.');
                    return;
                }

                throw new Error(result.message || 'Failed to update product');
            }

            if (result.success) {
                alert('Produk berhasil diubah!');
                navigate('/inventory');
            } else {
                alert(result.message || 'Gagal mengubah produk');
            }

        } catch (error) {
            console.error('Error updating product:', error);
            alert(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Yakin ingin membatalkan? Semua perubahan akan hilang.')) {
            navigate('/inventory');
        }
    };

    const renderImageSection = () => {
        const hasNewImage = imageFile !== null;
        const hasCurrentImage = currentImage && !removeCurrentImage;
        const showImage = (hasNewImage || hasCurrentImage) && imagePreview;

        return (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors">
                {showImage ? (
                    <div className="relative">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                        />

                        {hasNewImage && (
                            <>
                                <button
                                    type="button"
                                    onClick={cancelNewImage}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                    title="Batalkan gambar baru"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                    Gambar Baru
                                </div>
                            </>
                        )}

                        {hasCurrentImage && !hasNewImage && (
                            <button
                                type="button"
                                onClick={handleRemoveCurrentImage}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                title="Hapus gambar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div>
                        <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">
                            {removeCurrentImage ? 'Gambar akan dihapus' : 'Upload gambar produk'}
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG maksimal 10MB</p>
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
                    {showImage ? 'Ganti Gambar' : 'Pilih Gambar'}
                </label>
            </div>
        );
    };

    // Tampilkan loading jika belum selesai cek auth atau fetching data
    if (!isAuthenticated || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                    <p className="text-gray-600">
                        {!isAuthenticated ? 'Memeriksa authentication...' : 'Memuat data produk...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                            <h1 className="text-3xl font-bold text-gray-900">Ubah Produk</h1>
                            <p className="text-gray-600 mt-1">Ubah detail produk yang ada di inventori</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    <div className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gambar Produk</h3>
                                {renderImageSection()}
                            </div>

                            <div className="lg:col-span-2 space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">Detail Produk</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nama Produk *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Masukkan nama produk"
                                        />
                                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Kategori *
                                        </label>
                                        <select
                                            name="category_id"
                                            value={formData.category_id}
                                            onChange={handleInputChange}
                                            disabled={loadingCategories}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${errors.category_id ? 'border-red-500' : 'border-gray-300'} ${loadingCategories ? 'bg-gray-100' : ''}`}
                                        >
                                            <option value="">{loadingCategories ? 'Memuat kategori...' : 'Pilih kategori'}</option>
                                            {Array.isArray(categories) && categories.map(category => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            SKU *
                                        </label>
                                        <input
                                            type="text"
                                            name="sku"
                                            value={formData.sku}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${errors.sku ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Masukkan SKU"
                                        />
                                        {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Harga Jual (IDR) *
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Masukkan harga jual"
                                            min="0"
                                            step="0.01"
                                        />
                                        {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Harga Modal (IDR) *
                                        </label>
                                        <input
                                            type="number"
                                            name="cost_price"
                                            value={formData.cost_price}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${errors.cost_price ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Masukkan harga modal"
                                            min="0"
                                            step="0.01"
                                        />
                                        {errors.cost_price && <p className="text-red-500 text-sm mt-1">{errors.cost_price}</p>}
                                    </div>

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

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Deskripsi
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                                            placeholder="Masukkan deskripsi produk..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

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
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {submitting ? (
                                <>
                                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                                    Mengubah...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Simpan Perubahan
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateInventory;