import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    Save,
    ArrowLeft,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import axios from 'axios';

const UpdatePassword = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get user ID from URL
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.current_password.trim()) {
            newErrors.current_password = 'Password sekarang harus diisi';
        }

        if (!formData.new_password.trim()) {
            newErrors.new_password = 'Password baru harus diisi';
        } else if (formData.new_password.length < 6) {
            newErrors.new_password = 'Password baru minimal 6 karakter';
        }

        if (!formData.new_password_confirmation.trim()) {
            newErrors.new_password_confirmation = 'Konfirmasi password baru harus diisi';
        } else if (formData.new_password !== formData.new_password_confirmation) {
            newErrors.new_password_confirmation = 'Konfirmasi password tidak sama dengan password baru';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setErrors({});
        setSuccessMessage('');

        try {
            const token = localStorage.getItem('auth_token');

            if (!token) {
                throw new Error('Token autentikasi tidak ditemukan');
            }

            console.log('Sending password change data for user ID:', id);
            console.log('Data:', formData);

            const response = await axios.post(
                `http://127.0.0.1:8000/api/users/${id}/change-password`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('Response:', response.data);

            if (response.data.message) {
                // Tampilkan alert sukses
                alert('Password berhasil diubah!');

                // Redirect ke halaman users
                navigate('/users');
            }

        } catch (error) {
            console.error('Error updating password:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);

            if (error.response?.status === 422) {
                // Validation errors from backend
                console.log('Validation errors:', error.response.data);

                if (error.response.data.message === 'Password lama salah.') {
                    setErrors({ current_password: 'Password lama salah' });
                } else {
                    const backendErrors = {};
                    if (error.response.data.errors) {
                        Object.keys(error.response.data.errors).forEach(field => {
                            backendErrors[field] = error.response.data.errors[field][0];
                        });
                    }
                    setErrors(backendErrors);
                }
            } else if (error.response?.status === 401) {
                setErrors({ general: 'Sesi telah berakhir. Silakan login kembali.' });
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_id');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else if (error.response?.data?.message) {
                setErrors({ general: error.response.data.message });
            } else {
                setErrors({ general: 'Terjadi kesalahan saat mengubah password' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Yakin ingin membatalkan? Semua perubahan akan hilang.')) {
            navigate('/users');
        }
    };

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
                    <div className="flex items-center">
                        <div className="ml-4">
                            <h1 className="text-3xl font-bold text-gray-900">Ubah Password</h1>
                            <p className="text-gray-600 mt-1">Silahkan isi untuk mengubah password pengguna yang baru</p>
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                            <span className="text-green-700 font-medium">{successMessage}</span>
                        </div>
                    </div>
                )}

                {/* General Error */}
                {errors.general && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                            <span className="text-red-700 font-medium">{errors.general}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ubah Password</h3>
                        <div className="space-y-4">
                            {/* Password Sekarang */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password Sekarang <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        name="current_password"
                                        value={formData.current_password}
                                        onChange={handleInputChange}
                                        placeholder="Masukkan password sekarang"
                                        className={`w-full px-3 py-2 pr-10 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${errors.current_password
                                            ? 'border-red-300 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-green-500'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.current_password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
                                )}
                            </div>

                            {/* Password Baru */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password Baru <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        name="new_password"
                                        value={formData.new_password}
                                        onChange={handleInputChange}
                                        placeholder="Masukkan password baru"
                                        className={`w-full px-3 py-2 pr-10 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${errors.new_password
                                            ? 'border-red-300 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-green-500'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.new_password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
                                )}
                            </div>

                            {/* Konfirmasi Password Baru */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Konfirmasi Password Baru <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmNewPassword ? "text" : "password"}
                                        name="new_password_confirmation"
                                        value={formData.new_password_confirmation}
                                        onChange={handleInputChange}
                                        placeholder="Konfirmasi password baru"
                                        className={`w-full px-3 py-2 pr-10 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${errors.new_password_confirmation
                                            ? 'border-red-300 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-green-500'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.new_password_confirmation && (
                                    <p className="mt-1 text-sm text-red-600">{errors.new_password_confirmation}</p>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-gray-50 px-8 py-6 flex justify-end space-x-4 mt-6 rounded-xl">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={loading}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Mengubah...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Ubah Password
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

export default UpdatePassword;