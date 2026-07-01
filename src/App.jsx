import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserDashboard from './pages/UserDashboard';
import Inventory from './pages/Inventory';
import Inventaris from './pages/Inventaris';
import AddInventory from './pages/CRUD/Inventory/AddInventory';
import EditInventory from './pages/CRUD/Inventory/UpdateInventory';
import EditStockInventory from './pages/CRUD/Inventory/UpdateStockInventory';
import AddUser from './pages/CRUD/User/AddUser';
import EditUser from './pages/CRUD/User/UpdateUser';
import ChangePassword from './pages/CRUD/User/UpdatePassword';
import StockNote from './pages/StockNote';
import RequestNote from './pages/RequestNote';
import Users from './pages/User';
import EmailChange from './pages/EmailChange';
import ApprovalNote from './pages/ApprovalNote';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={
          <Layout><Dashboard /></Layout>} />
        <Route path="/homeuser" element={
          <Layout><UserDashboard /></Layout>} />
        <Route path="/inventaris" element={<Layout><Inventaris /></Layout>} />
        <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
        <Route path="/inventory/add" element={<Layout><AddInventory /></Layout>} />
        <Route path="/inventory/edit/:id" element={<Layout><EditInventory /></Layout>} />
        <Route path="/inventory/edit/:id/stock" element={<Layout><EditStockInventory /></Layout>} />
        <Route path="/stocknote" element={<Layout><StockNote /></Layout>} />
        <Route path="/requestnote" element={<Layout><RequestNote /></Layout>} />
        <Route path="/approvalnote" element={<Layout><ApprovalNote /></Layout>} />
        <Route path="/users" element={<Layout><Users /></Layout>} />
        <Route path="/users/add" element={<Layout><AddUser /></Layout>} />
        <Route path="/users/edit/:id" element={<Layout><EditUser /></Layout>} />
        <Route path="/users/changepass/:id" element={<Layout><ChangePassword /></Layout>} />
        <Route path="/emailchange" element={<Layout><EmailChange /></Layout>} />
      </Routes>
    </Router>
  );
}
export default App;