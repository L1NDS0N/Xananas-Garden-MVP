import React from 'react';
import AdminHeader from '../../../components/AdminHeader';
import AdminSidebar from '../../../components/AdminSidebar';
import DefaultPage from '../../../components/DefaultPage';

const AdminDashboard: React.FC = () => {
  return (
    <DefaultPage title="Dashboard">
      <AdminHeader/>
      <AdminSidebar/>
    </DefaultPage>
  );
};

export default AdminDashboard;
