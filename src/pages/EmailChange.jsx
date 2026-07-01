import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Save, RotateCcw, CheckCircle, XCircle, Plus, Trash2, Bell, BellOff } from 'lucide-react';

const EmailSettings = () => {
    const [emailSettings, setEmailSettings] = useState({
        requestNotifications: true,
        adminEmail: '',
        ccEmails: [],
        lowStockThreshold: 10,
        lowStockNotifications: true
    });

    const [newEmail, setNewEmail] = useState('');
    const [ccEmail, setCcEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [thresholdInput, setThresholdInput] = useState('10');
    const [notifications, setNotifications] = useState({
        success: '',
        error: ''
    });

    const API_BASE_URL = 'http://127.0.0.1:8000/api';

    useEffect(() => {
        fetchEmailSettings();
    }, []);

    const showNotification = (type, message) => {
        setNotifications({ [type]: message });
        setTimeout(() => setNotifications({ success: '', error: '' }), 4000);
    };

    const fetchEmailSettings = async () => {
        try {
            setIsLoading(true);
            const { data } = await axios.get(`${API_BASE_URL}/email-settings`);
            if (data.success) {
                setEmailSettings(data.data);
                setNewEmail(data.data.adminEmail);
                setThresholdInput(data.data.lowStockThreshold.toString());
            } else {
                showNotification('error', data.message || 'Gagal memuat pengaturan email');
            }
        } catch (err) {
            showNotification('error', 'Gagal memuat pengaturan email: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const updateSettings = async (payload, successMessage) => {
        try {
            setSaveLoading(true);
            const { data } = await axios.put(`${API_BASE_URL}/email-settings`, payload);

            if (data.success) {
                setEmailSettings(data.data);
                if (payload.adminEmail) setNewEmail(data.data.adminEmail);
                showNotification('success', successMessage || 'Pengaturan berhasil diperbarui');
                return true;
            } else {
                showNotification('error', data.message || 'Gagal memperbarui pengaturan');
                return false;
            }
        } catch (err) {
            showNotification('error', 'Terjadi kesalahan: ' + err.message);
            return false;
        } finally {
            setSaveLoading(false);
        }
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        if (!newEmail.trim()) {
            showNotification('error', 'Email tidak boleh kosong');
            return;
        }
        if (!isValidEmail(newEmail)) {
            showNotification('error', 'Format email tidak valid');
            return;
        }

        const success = await updateSettings({
            adminEmail: newEmail.trim(),
            requestNotifications: emailSettings.requestNotifications,
            lowStockNotifications: emailSettings.lowStockNotifications,
            lowStockThreshold: emailSettings.lowStockThreshold,
            ccEmails: emailSettings.ccEmails
        }, 'Email admin berhasil diperbarui');
    };

    const addCcEmail = async () => {
        if (!ccEmail.trim()) {
            showNotification('error', 'Email CC tidak boleh kosong');
            return;
        }
        if (!isValidEmail(ccEmail)) {
            showNotification('error', 'Format email CC tidak valid');
            return;
        }
        if (emailSettings.ccEmails.includes(ccEmail.trim())) {
            showNotification('error', 'Email sudah ditambahkan sebelumnya');
            return;
        }

        const updatedCcEmails = [...emailSettings.ccEmails, ccEmail.trim()];
        const success = await updateSettings(
            { ...emailSettings, ccEmails: updatedCcEmails },
            'Email CC berhasil ditambahkan'
        );

        if (success) setCcEmail('');
    };

    const removeCcEmail = async (emailToRemove) => {
        const updatedCcEmails = emailSettings.ccEmails.filter(e => e !== emailToRemove);
        const success = await updateSettings(
            { ...emailSettings, ccEmails: updatedCcEmails },
            'Email CC berhasil dihapus'
        );
    };

    const handleToggleNotification = async (type) => {
        const newValue = !emailSettings[type];
        const success = await updateSettings(
            { ...emailSettings, [type]: newValue },
            `Notifikasi ${type === 'requestNotifications' ? 'permintaan' : 'stok rendah'} ${newValue ? 'diaktifkan' : 'dinonaktifkan'}`
        );
    };

    const handleThresholdChange = async () => {
        const value = parseInt(thresholdInput, 10);
        if (isNaN(value) || value < 0) {
            showNotification('error', 'Nilai batas stok harus angka positif');
            return;
        }

        const success = await updateSettings(
            { ...emailSettings, lowStockThreshold: value },
            `Batas stok rendah diperbarui menjadi ${value}`
        );
    };

    const resetToDefault = async () => {
        if (!window.confirm('Yakin ingin mengembalikan pengaturan ke default?')) return;

        const success = await updateSettings({
            adminEmail: 'aribiya@gmail.com',
            requestNotifications: true,
            lowStockNotifications: true,
            lowStockThreshold: 10,
            ccEmails: []
        }, 'Pengaturan berhasil dikembalikan ke default');
    };

    const handleCcEmailKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCcEmail();
        }
    };

    const handleThresholdKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleThresholdChange();
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            {/* Notifications */}
            {notifications.success && (
                <div className="fixed top-4 right-4 bg-green-50 border border-green-200 text-green-800 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{notifications.success}</span>
                </div>
            )}
            {notifications.error && (
                <div className="fixed top-4 right-4 bg-red-50 border border-red-200 text-red-800 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2">
                    <XCircle className="w-5 h-5" />
                    <span>{notifications.error}</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                <Mail className="w-8 h-8 mr-3 text-green-600" />
                                Pengaturan Email Notifikasi
                            </h1>
                            <p className="text-gray-600 mt-2 text-lg">
                                Kelola email penerima notifikasi permintaan barang dan stok rendah
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Email Configuration */}
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                    <Mail className="w-5 h-5 mr-2 text-green-600" />
                                    Email Penerima Utama
                                </h3>
                                <form onSubmit={handleUpdateEmail} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Email Admin
                                        </label>
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="masukkan.email@domain.com"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                            required
                                            disabled={saveLoading}
                                        />
                                        <p className="text-sm text-gray-500 mt-2">
                                            Email ini akan menerima notifikasi semua permintaan barang yang diajukan
                                        </p>
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={saveLoading}
                                            className="flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {saveLoading ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            ) : (
                                                <Save className="w-5 h-5 mr-2" />
                                            )}
                                            {saveLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={resetToDefault}
                                            disabled={saveLoading}
                                            className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:shadow transition-all disabled:opacity-50"
                                        >
                                            <RotateCcw className="w-5 h-5 mr-2" />
                                            Reset Default
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* CC Emails */}
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                    <Mail className="w-5 h-5 mr-2 text-blue-600" />
                                    Email CC (Tambahan)
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex space-x-3">
                                        <input
                                            type="email"
                                            value={ccEmail}
                                            onChange={(e) => setCcEmail(e.target.value)}
                                            onKeyPress={handleCcEmailKeyPress}
                                            placeholder="tambahan.email@domain.com"
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            disabled={saveLoading}
                                        />
                                        <button
                                            onClick={addCcEmail}
                                            disabled={saveLoading || !ccEmail.trim()}
                                            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        >
                                            <Plus className="w-5 h-5 mr-2" />
                                            Tambah
                                        </button>
                                    </div>

                                    {emailSettings.ccEmails.length > 0 && (
                                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                                            {emailSettings.ccEmails.map((email, index) => (
                                                <div key={index} className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0 bg-gray-50 hover:bg-gray-100 transition-colors">
                                                    <span className="text-sm font-medium text-gray-700">{email}</span>
                                                    <button
                                                        onClick={() => removeCcEmail(email)}
                                                        disabled={saveLoading}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-500">
                                        Email CC akan menerima salinan dari setiap notifikasi yang dikirim
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Settings */}
                        <div className="space-y-6">
                            {/* Notification Settings */}
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                    <Bell className="w-5 h-5 mr-2 text-purple-600" />
                                    Pengaturan Notifikasi
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">Notifikasi Permintaan</p>
                                            <p className="text-sm text-gray-500 mt-1">Kirim email saat ada permintaan barang baru</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggleNotification('requestNotifications')}
                                            disabled={saveLoading}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-50 ${emailSettings.requestNotifications ? 'bg-green-600' : 'bg-gray-300'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${emailSettings.requestNotifications ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">Notifikasi Stok Rendah</p>
                                            <p className="text-sm text-gray-500 mt-1">Kirim email saat stok produk menipis</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggleNotification('lowStockNotifications')}
                                            disabled={saveLoading}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-50 ${emailSettings.lowStockNotifications ? 'bg-green-600' : 'bg-gray-300'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${emailSettings.lowStockNotifications ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Low Stock Threshold */}
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                    <Bell className="w-5 h-5 mr-2 text-orange-600" />
                                    Batas Stok Rendah
                                </h3>
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Threshold Stok Rendah
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            value={thresholdInput}
                                            onChange={(e) => setThresholdInput(e.target.value)}
                                            onKeyPress={handleThresholdKeyPress}
                                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center"
                                            disabled={saveLoading}
                                        />
                                        <span className="text-gray-600 font-medium">item</span>
                                        <button
                                            onClick={handleThresholdChange}
                                            disabled={saveLoading || thresholdInput === emailSettings.lowStockThreshold.toString()}
                                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Simpan
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Notifikasi stok rendah akan dikirim saat jumlah stok ≤ {emailSettings.lowStockThreshold} item
                                    </p>
                                </div>
                            </div>

                            {/* Current Status */}
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                                    Status Saat Ini
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Email Utama:</span>
                                        <span className="font-semibold text-gray-900">{emailSettings.adminEmail || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Email CC:</span>
                                        <span className="font-semibold text-gray-900">{emailSettings.ccEmails.length} email</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Notifikasi Aktif:</span>
                                        <span className={`font-semibold ${emailSettings.requestNotifications ? 'text-green-600' : 'text-red-600'}`}>
                                            {emailSettings.requestNotifications ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600">Batas Stok:</span>
                                        <span className="font-semibold text-gray-900">{emailSettings.lowStockThreshold} item</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailSettings;