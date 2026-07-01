import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { BarChart3, Package, Users, TrendingUp, RefreshCw } from "lucide-react";
import StatCard from "../components/Dashboard/StatCard";
import RecentActivity from "../components/Dashboard/RecentActivity";
import ChartWidget from "../components/Dashboard/ChartWidget";

// === Axios Setup ===
axios.defaults.baseURL = "http://127.0.0.1:8000";
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers.Accept = "application/json";
  return config;
});
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

const calcChange = (current, previous) => {
  const c = Number(current || 0);
  const p = Number(previous || 0);
  if (p === 0) return c === 0 ? 0 : 100;
  return ((c - p) / p) * 100;
};
const labelChange = (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
const trend = (v) => (v > 0 ? "up" : v < 0 ? "down" : "neutral");

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [prevStats, setPrevStats] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const baseStats = [
    { title: "Total Products", icon: Package, color: "bg-emerald-600" },
    { title: "In Stock", icon: Users, color: "bg-green-600" },
    { title: "Low Stock", icon: TrendingUp, color: "bg-yellow-600" },
    { title: "Out of Stock", icon: BarChart3, color: "bg-red-600" },
  ];

  const calculateStatsManually = (products) => {
    const total = products.length;
    const inStock = products.filter((p) => p.status === "in_stock").length;
    const lowStock = products.filter((p) => p.status === "low_stock").length;
    const outOfStock = products.filter(
      (p) => p.status === "out_of_stock"
    ).length;

    const prev = prevStats
      ? [
          +prevStats[0].value,
          +prevStats[1].value,
          +prevStats[2].value,
          +prevStats[3].value,
        ]
      : [0, 0, 0, 0];

    const values = [total, inStock, lowStock, outOfStock];

    const nextStats = baseStats.map((s, i) => {
      const diff = calcChange(values[i], prev[i]);
      return {
        ...s,
        value: String(values[i]),
        change: labelChange(diff),
        trend: trend(diff),
      };
    });

    setStats(nextStats);
    setPrevStats(nextStats);
  };

  const updateStatsFromServer = (products, server) => {
    const cur = {
      total: Number(server.total_products ?? products.length ?? 0),
      inStock: Number(server.in_stock ?? 0),
      lowStock: Number(server.low_stock ?? 0),
      outOfStock: Number(server.out_of_stock ?? 0),
    };

    const prevServer = server.previous || server.previous_month || null;
    const prev = prevServer
      ? {
          total: Number(prevServer.total_products ?? 0),
          inStock: Number(prevServer.in_stock ?? 0),
          lowStock: Number(prevServer.low_stock ?? 0),
          outOfStock: Number(prevServer.out_of_stock ?? 0),
        }
      : prevStats
      ? {
          total: +prevStats[0].value,
          inStock: +prevStats[1].value,
          lowStock: +prevStats[2].value,
          outOfStock: +prevStats[3].value,
        }
      : { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 };

    const vals = [
      { cur: cur.total, prev: prev.total },
      { cur: cur.inStock, prev: prev.inStock },
      { cur: cur.lowStock, prev: prev.lowStock },
      { cur: cur.outOfStock, prev: prev.outOfStock },
    ];

    const nextStats = baseStats.map((s, i) => {
      const diff = calcChange(vals[i].cur, vals[i].prev);
      return {
        ...s,
        value: String(vals[i].cur),
        change: labelChange(diff),
        trend: trend(diff),
      };
    });

    setStats(nextStats);
    setPrevStats(nextStats);
  };

  // === Ambil permission + role user ===
  const fetchUserPermissions = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const storedUser = user;
      const userId = storedUser?.id;

      if (!token || !userId) return;

      const { data } = await axios.get(`/api/users/${userId}/permissions`);
      const permissions = data.permissions || [];
      const updatedUser = data.user;

      setUserPermissions(permissions);
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Failed to fetch user permissions:", err);
    }
  };

  const fetchData = async () => {
    try {
      const [productsRes, statsRes] = await Promise.all([
        axios.get("/api/products"),
      ]);

      const products = productsRes.data?.data || productsRes.data || [];
      const statsData = statsRes?.data?.data || statsRes?.data || null;

      if (statsData) {
        updateStatsFromServer(products, statsData);
      } else {
        calculateStatsManually(products);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setStats(
        baseStats.map((s) => ({
          ...s,
          value: "0",
          change: "0%",
          trend: "neutral",
        }))
      );
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchUserPermissions(), fetchData()]);
      setLoading(false);
    };
    init();
  });

  const hasPermission = (permission) => {
    if (user?.role === "Superadmin") return true;
    return userPermissions.includes(permission);
  };

  const hasRole = (roles) =>
    !roles || roles.length === 0 || roles.includes(user?.role);

  const actions = [
    {
      title: "Tambah Inventori",
      color: "from-blue-500 to-blue-600",
      icon: Package,
      route: "/inventory/add",
      requiredPermissions: ["create_inventory"],
      roles: ["Admin", "Superadmin"],
    },
    {
      title: "Atur Pengguna",
      color: "from-green-500 to-green-600",
      icon: Users,
      route: "/users",
      requiredPermissions: ["create_users"],
      roles: ["Superadmin"],
    },
    {
      title: "Pantau Laporan Stok",
      color: "from-purple-500 to-purple-600",
      icon: BarChart3,
      route: "/stocknote",
      requiredPermissions: ["view_stocknote"],
      roles: ["Admin", "Superadmin"],
    },
  ].filter(
    (a) =>
      hasRole(a.roles) &&
      (!a.requiredPermissions ||
        a.requiredPermissions.some((perm) => hasPermission(perm)))
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  if (loading) {
    return <p className="p-6">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Beranda</h1>
          <p className="text-gray-600 mt-1">
            Selamat datang di Goodong.id, {user?.name}!
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={stat.title} stat={stat} index={idx} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartWidget />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Tombol Cepat</h3>

        {actions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Tidak ada tombol aksi yang tersedia untuk role Anda.</p>
            <p className="text-sm mt-2">
              Role: {user?.role} | Permissions: {userPermissions.length}
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-6`}
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
            }}
          >
            {actions.map((a) => (
              <Link
                key={a.title}
                to={a.route}
                className={`p-4 bg-gradient-to-r ${a.color} text-white rounded-xl hover:shadow-lg 
                  transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 no-underline`}
              >
                <a.icon className="w-5 h-5" />
                <span className="font-medium">{a.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
