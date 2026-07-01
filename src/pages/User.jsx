import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
    Plus,
    Search,
    Mail,
    Calendar,
    UserCheck,
    UserX,
    Ban,
    Edit,
    Trash,
    Lock,
    Check,
    Crown,
    User
} from 'lucide-react';

const Users = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [hovered, setHovered] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://127.0.0.1:8000/api/users');

            if (response.data && response.data.success) {
                const usersData = response.data.data || [];
                setUsers(usersData.map(u => ({
                    ...u,
                    role: u.role?.name || 'User'
                })));
            } else {
                console.error('Response tidak valid:', response.data);
            }
        } catch (error) {
            console.error('Gagal fetch users:', error);
            alert('Gagal memuat data pengguna');
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchUsers();
    }, []);

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Admin':
                return <UserCheck className="w-4 h-4 text-green-500" />;
            case 'Superadmin':
                return <Crown className="w-4 h-4 text-blue-500" />;
            default:
                return <User className="w-4 h-4 text-gray-500" />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Admin':
                return 'bg-green-100 text-green-800';
            case 'Superadmin':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (isBlocked) => {
        return !isBlocked ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    const handleDelete = async (userId) => {
        // Konfirmasi dengan dialog browser
        if (window.confirm('Yakin ingin menghapus pengguna ini?')) {
            try {
                // Simpan state lama untuk rollback jika gagal
                const previousItems = [...users];

                // Update state langsung (optimistic update)
                setUsers(users.filter(user => user.id !== userId));

                // Panggil API
                await axios.delete(`http://127.0.0.1:8000/api/users/${userId}`);

            } catch (error) {
                // Jika gagal, kembalikan state ke sebelumnya
                console.error('Error menghapus pengguna:', error);
                setUsers(previousItems);
                alert('Gagal hapus pengguna');
            }
        }
    };

    const handleBlock = async (userId) => {
        // Cari user yang akan diblokir/unblokir
        const userToToggle = users.find(user => user.id === userId);

        if (!userToToggle) {
            alert('User tidak ditemukan');
            return;
        }

        const newBlockStatus = !userToToggle.is_blocked;

        // Konfirmasi dengan dialog browser
        const confirmMessage = newBlockStatus
            ? `Yakin ingin memblokir ${userToToggle.name}?`
            : `Yakin ingin membuka blokir ${userToToggle.name}?`;

        if (window.confirm(confirmMessage)) {
            try {
                // Simpan state lama untuk rollback jika gagal
                const previousUsers = [...users];

                // Update state langsung (optimistic update)
                setUsers(users.map(user =>
                    user.id === userId
                        ? { ...user, is_blocked: newBlockStatus }
                        : user
                ));

                // Panggil API dengan data yang sesuai backend
                const response = await axios.patch(`http://127.0.0.1:8000/api/users/${userId}/block-status`, {
                    is_blocked: newBlockStatus
                });

                console.log('Response toggle block:', response.data);

                // Update dengan data dari server untuk memastikan sinkronisasi
                if (response.data.data) {
                    setUsers(users.map(user =>
                        user.id === userId
                            ? response.data.data
                            : user
                    ));
                }

                alert(response.data.message || 'Status blokir berhasil diubah');

            } catch (error) {
                // Jika gagal, kembalikan state ke sebelumnya
                console.error('Error mengubah status blokir pengguna:', error);
                setUsers(previousUsers);

                const errorMessage = error.response?.data?.message || 'Gagal mengubah status blokir pengguna';
                alert(errorMessage);
            }
        }
    };
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manajemen User</h1>
                    <p className="text-gray-600 mt-1">Mengatur data pengguna dari segi role dan akses</p>
                </div>
                <Link
                    to="/users/add"
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Pengguna
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-5 sm:grid-cols-4 lg:grid-cols-4 gap-2">
                {[
                    {
                        title: 'Total Users',
                        icon: User,
                        value: users.length,
                        color: 'bg-emerald-500'
                    },
                    {
                        title: 'Admins',
                        icon: UserCheck,
                        value: users.filter(u => u.role === 'Admin').length,
                        color: 'bg-green-500'
                    },
                    {
                        title: 'Superadmins',
                        icon: Crown,
                        value: users.filter(u => u.role === 'Superadmin').length,
                        color: 'bg-amber-500'
                    },
                    {
                        title: 'Users',
                        icon: User,
                        value: users.filter(u => u.role === 'User').length,
                        color: 'bg-orange-500'
                    },
                ].map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                        <div
                            key={stat.title}
                            className={`${stat.color} p-6 rounded-2xl text-white transform hover:scale-105 transition-all duration-300`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/80 text-sm font-medium">{stat.title}</p>
                                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                                </div>
                                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                                    <IconComponent className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari pengguna..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="all">Semua Role</option>
                            <option value="Admin">Admin</option>
                            <option value="Superadmin">Superadmin</option>
                            <option value="User">User</option> {/* Tambahkan ini */}
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user, index) => (
                    <div
                        key={user.id}
                        className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fade-in-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">{getInitials(user.name)}</span>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                        {getRoleIcon(user.role)}
                                        <span className="ml-1">{user.role}</span>
                                    </span>
                                </div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.is_blocked)}`}>
                                {!user.is_blocked ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
                                {!user.is_blocked ? 'Active' : 'Blocked'}
                            </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-2" />
                                {user.email}
                            </div>
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                Joined {new Date(user.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    {/* Edit */}
                                    <div className="relative">
                                        <Link
                                            to={`/users/edit/${user.id}`}
                                            onMouseEnter={() => setHovered({ id: user.id, type: 'edit' })}
                                            onMouseLeave={() => setHovered(null)}
                                            className="flex items-center justify-center p-2 text-green-600 hover:bg-green-50 rounded transition-colors duration-200"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        {hovered && hovered.id === user.id && hovered.type === 'edit' && (
                                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                                                Ubah
                                            </div>
                                        )}
                                    </div>

                                    {/* Password */}
                                    <div className="relative">
                                        <Link
                                            to={`/users/changepass/${user.id}`}
                                            onMouseEnter={() => setHovered({ id: user.id, type: 'password' })}
                                            onMouseLeave={() => setHovered(null)}
                                            className="flex items-center justify-center p-2 text-green-600 hover:bg-green-50 rounded transition-colors duration-200"
                                        >
                                            <Lock className="w-4 h-4" />
                                        </Link>
                                        {hovered && hovered.id === user.id && hovered.type === 'password' && (
                                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                                                Ganti Password
                                            </div>
                                        )}
                                    </div>

                                    {/* Delete */}
                                    <div className="relative">
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            onMouseEnter={() => setHovered({ id: user.id, type: 'delete' })}
                                            onMouseLeave={() => setHovered(null)}
                                            className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                        {hovered && hovered.id === user.id && hovered.type === 'delete' && (
                                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                                                Hapus
                                            </div>
                                        )}
                                    </div>

                                    {/* Block */}
                                    <div className="relative">
                                        <button
                                            onClick={() => handleBlock(user.id)}
                                            onMouseEnter={() => setHovered({ id: user.id, type: 'block' })}
                                            onMouseLeave={() => setHovered(null)}
                                            className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                        >
                                            <Ban className="w-4 h-4" />
                                        </button>
                                        {hovered && hovered.id === user.id && hovered.type === 'block' && (
                                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                                                Blokir
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Users;
