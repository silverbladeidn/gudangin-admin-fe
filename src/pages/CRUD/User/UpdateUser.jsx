import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    Save, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, Shield, UserCheck
} from 'lucide-react';
import axios from 'axios';

const UpdateUser = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [loadingUser, setLoadingUser] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [permissions, setPermissions] = useState([]);
    const [roles, setRoles] = useState([]);
    const [selectedPerms, setSelectedPerms] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: '',
    });

    // Load roles, permissions, dan user data saat component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Load roles
                const rolesResponse = await axios.get('http://127.0.0.1:8000/api/roles');
                setRoles(rolesResponse.data);

                // Load permissions
                const permsResponse = await axios.get('http://127.0.0.1:8000/api/permissions');
                setPermissions(permsResponse.data.data || permsResponse.data);

                // Load user data
                await fetchUser();
            } catch (err) {
                console.error('Gagal memuat data:', err);
                setErrors({ general: 'Gagal memuat data' });
                setLoadingUser(false);
            }
        };
        fetchData();
    }, [id]);

    // Fetch user data
    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('Token autentikasi tidak ditemukan');

            const response = await axios.get(
                `http://127.0.0.1:8000/api/users/${id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('User data:', response.data);

            if (response.data.data) {
                const userData = response.data.data;

                // Set form data dengan data lama
                setFormData({
                    name: userData.name || '',
                    email: userData.email || '',
                    password: '', // Password dikosongkan untuk keamanan
                    role: userData.role_id || userData.role || ''
                });

                // Set permissions yang sudah dimiliki user
                if (userData.permissions && Array.isArray(userData.permissions)) {
                    const userPermissionIds = userData.permissions.map(p => p.id);
                    setSelectedPerms(userPermissionIds);
                }
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            if (error.response?.status === 404) {
                setErrors({ general: 'User tidak ditemukan' });
            } else if (error.response?.status === 401) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_id');
                navigate('/login');
            } else {
                setErrors({ general: 'Gagal memuat data user' });
            }
        } finally {
            setLoadingUser(false);
        }
    };

    // Handler ketika role berubah
    const handleRoleChange = (e) => {
        const selectedRoleId = e.target.value;
        const selectedRole = roles.find(role => role.id == selectedRoleId);

        setFormData(prev => ({
            ...prev,
            role: selectedRoleId
        }));

        // Opsional: Reset permissions ketika role berubah
        // setSelectedPerms([]);
    };

    // Input handler untuk field lainnya
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Toggle permission selection
    const togglePermission = (id) => {
        setSelectedPerms(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    // Select All permissions
    const selectAllPermissions = () => {
        if (permissions.length === 0) return;
        const allPermissionIds = permissions.map(p => p.id);
        setSelectedPerms(allPermissionIds);
    };

    // Deselect All permissions
    const deselectAllPermissions = () => {
        setSelectedPerms([]);
    };

    // Toggle Select All
    const toggleSelectAll = () => {
        if (selectedPerms.length === permissions.length) {
            deselectAllPermissions();
        } else {
            selectAllPermissions();
        }
    };

    // Cek apakah semua permissions terpilih
    const isAllSelected = permissions.length > 0 && selectedPerms.length === permissions.length;

    // Cek apakah sebagian permissions terpilih
    const isSomeSelected = selectedPerms.length > 0 && selectedPerms.length < permissions.length;

    // Validasi form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Nama lengkap harus diisi';
        if (!formData.email.trim()) {
            newErrors.email = 'Email harus diisi';
        } else if (!/\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = 'Format email tidak valid';
        }
        if (!formData.role) {
            newErrors.role = 'Pilih role pengguna';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setErrors({});
        setSuccessMessage('');

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('Token autentikasi tidak ditemukan');

            // Siapkan payload - hanya kirim password jika diisi
            const payload = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                permissions: selectedPerms
            };

            // Hanya kirim password jika diisi (untuk update)
            if (formData.password.trim()) {
                payload.password = formData.password;
            }

            console.log('Update payload:', payload);

            const response = await axios.put(
                `http://127.0.0.1:8000/api/users/${id}`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                }
            );

            console.log('Response:', response.data);

            setSuccessMessage('Pengguna berhasil diperbarui!');

            // Tampilkan alert dan redirect
            setTimeout(() => {
                alert('User berhasil diperbarui!');
                navigate('/users');
            }, 1000);

        } catch (error) {
            console.error('Error updating user:', error);
            const status = error.response?.status;

            if (status === 422 && error.response.data?.errors) {
                const backendErrors = {};
                Object.entries(error.response.data.errors).forEach(([field, msg]) => {
                    backendErrors[field] = msg[0];
                });
                setErrors(backendErrors);
            } else if (status === 401) {
                setErrors({ general: 'Sesi berakhir. Silakan login kembali.' });
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_id');
                setTimeout(() => (window.location.href = '/login'), 1500);
            } else if (status === 404) {
                setErrors({ general: 'User tidak ditemukan' });
            } else {
                setErrors({ general: error.response?.data?.message || 'Terjadi kesalahan server' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Batalkan perubahan pengguna?')) {
            navigate('/users');
        }
    };

    // Helper function untuk menentukan config berdasarkan role
    const getPermissionConfig = (roleName) => {
        const configs = {
            'super': {
                title: 'Hak Akses Super Administrator',
                description: 'Super Administrator memiliki akses penuh ke semua fitur sistem. Anda dapat menyesuaikan permissions khusus jika diperlukan.',
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-200',
                textColor: 'text-purple-700',
                iconColor: 'text-purple-600',
                checkboxColor: 'text-purple-600 focus:ring-purple-500',
                hoverBorder: 'hover:border-purple-300',
                buttonColor: 'bg-purple-600 hover:bg-purple-700'
            },
            'admin': {
                title: 'Hak Akses Administrator',
                description: 'Administrator dapat mengelola inventory dan stok, tetapi tidak dapat mengelola pengguna Super Administrator.',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                textColor: 'text-blue-700',
                iconColor: 'text-blue-600',
                checkboxColor: 'text-blue-600 focus:ring-blue-500',
                hoverBorder: 'hover:border-blue-300',
                buttonColor: 'bg-blue-600 hover:bg-blue-700'
            },
            'user': {
                title: 'Hak Akses User',
                description: 'User biasa hanya dapat melihat inventory dan membuat permintaan. Akses terbatas pada fitur tertentu.',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                textColor: 'text-green-700',
                iconColor: 'text-green-600',
                checkboxColor: 'text-green-600 focus:ring-green-500',
                hoverBorder: 'hover:border-green-300',
                buttonColor: 'bg-green-600 hover:bg-green-700'
            }
        };

        const lowerRoleName = roleName.toLowerCase();

        if (lowerRoleName.includes('super') || lowerRoleName.includes('superadmin') || lowerRoleName.includes('super admin')) {
            return configs.super;
        } else if (lowerRoleName.includes('admin') || lowerRoleName.includes('administrator')) {
            return configs.admin;
        } else {
            return configs.user;
        }
    };

    // Dapatkan role name yang dipilih
    const selectedRole = roles.find(role => role.id == formData.role);
    const roleName = selectedRole?.name || '';
    const permissionConfig = getPermissionConfig(roleName);

    if (loadingUser) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                        <span className="ml-3 text-gray-600">Memuat data user...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/users"
                        className="inline-flex items-center text-gray-600 rounded-lg px-3 py-1 hover:bg-green-400 hover:text-black mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Pengguna
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Ubah Pengguna</h1>
                    <p className="text-gray-600 mt-1">Perbarui data pengguna</p>
                </div>

                {/* Success / Error */}
                {successMessage && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        <span className="text-green-700 font-medium">{successMessage}</span>
                    </div>
                )}
                {errors.general && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                        <span className="text-red-700 font-medium">{errors.general}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Diri</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nama */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Nama Lengkap <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 ${errors.name ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                    placeholder="Masukkan nama lengkap"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 ${errors.email ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                    placeholder="Masukkan email"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            {/* Password (Opsional untuk update) */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Password Baru (Opsional)
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 pr-10 border rounded-xl focus:outline-none focus:ring-2 ${errors.password ? 'border-red-300 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-green-500'
                                            }`}
                                        placeholder="Kosongkan jika tidak ingin mengubah password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                <p className="mt-1 text-sm text-gray-500">Minimal 6 karakter</p>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleRoleChange}
                                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 ${errors.role ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-green-500'
                                        }`}
                                    required
                                >
                                    <option value="">Pilih Role</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                            </div>
                        </div>

                        {/* SECTION PERMISSIONS - SAMA DENGAN AddUser */}
                        <div className="mt-6">
                            {formData.role ? (
                                <div className={`${permissionConfig.bgColor} border ${permissionConfig.borderColor} rounded-2xl p-6`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <Shield className={`w-5 h-5 ${permissionConfig.iconColor} mr-2`} />
                                            <h3 className="text-lg font-semibold text-gray-900">{permissionConfig.title}</h3>
                                        </div>
                                    </div>

                                    <p className={`text-sm ${permissionConfig.textColor} mb-4`}>
                                        {permissionConfig.description}
                                    </p>

                                    {permissions.length === 0 ? (
                                        <p className="text-gray-500 text-sm">Memuat daftar permission…</p>
                                    ) : (
                                        <>
                                            {/* Select All Checkbox */}
                                            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                                                <label className="flex items-center space-x-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isAllSelected}
                                                        onChange={toggleSelectAll}
                                                        className={`rounded ${permissionConfig.checkboxColor}`}
                                                    />
                                                    <span className="font-medium text-gray-900">
                                                        {isAllSelected ? 'Semua permissions terpilih' :
                                                            isSomeSelected ? 'Sebagian permissions terpilih' :
                                                                'Pilih semua permissions'}
                                                    </span>
                                                </label>
                                            </div>

                                            {/* Permissions List */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {permissions.map(p => (
                                                    <label
                                                        key={p.id}
                                                        className={`flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200 ${permissionConfig.hoverBorder} transition-colors cursor-pointer hover:shadow-md`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            value={p.id}
                                                            checked={selectedPerms.includes(p.id)}
                                                            onChange={() => togglePermission(p.id)}
                                                            className={`mt-1 rounded ${permissionConfig.checkboxColor} cursor-pointer`}
                                                        />
                                                        <div className="flex-1">
                                                            <span className="font-medium text-gray-900 block">{p.name}</span>
                                                            <span className="text-sm text-gray-600 block mt-1">{p.description}</span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* Selected Permissions Counter */}
                                    <div className={`mt-4 flex items-center justify-between text-sm ${permissionConfig.textColor}`}>
                                        <div className="flex items-center">
                                            <UserCheck className="w-4 h-4 mr-2" />
                                            <span>
                                                {selectedPerms.length} dari {permissions.length} permissions dipilih untuk {roleName}
                                            </span>
                                        </div>

                                        {permissions.length > 0 && (
                                            <span className="font-medium">
                                                {Math.round((selectedPerms.length / permissions.length) * 100)}% terpilih
                                            </span>
                                        )}
                                    </div>

                                    {/* Info khusus berdasarkan role */}
                                    <div className={`mt-4 p-3 rounded-lg ${permissionConfig.bgColor} border ${permissionConfig.borderColor}`}>
                                        <p className={`text-sm ${permissionConfig.textColor} font-medium`}>
                                            {roleName.toLowerCase().includes('super') && 'Super Admin disarankan memiliki semua permissions untuk akses penuh.'}
                                            {roleName.toLowerCase().includes('admin') && !roleName.toLowerCase().includes('super') && 'Admin biasanya membutuhkan permissions view, create, dan edit untuk inventory management.'}
                                            {!roleName.toLowerCase().includes('super') && !roleName.toLowerCase().includes('admin') && 'User biasanya hanya membutuhkan permissions view untuk inventaris dan create untuk request.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                                    <div className="flex items-center mb-4">
                                        <Shield className="w-5 h-5 text-gray-600 mr-2" />
                                        <h3 className="text-lg font-semibold text-gray-900">Hak Akses Pengguna</h3>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Pilih role terlebih dahulu untuk menampilkan opsi permissions yang tersedia.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={loading}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium flex items-center hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Ubah Pengguna
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateUser;