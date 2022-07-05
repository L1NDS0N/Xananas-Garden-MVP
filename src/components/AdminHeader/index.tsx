import React from 'react';
import AdminConfigs from '../AdminConfigs';

const AdminHeader: React.FC = () => {
  return (
    <div className="flex flex-1 bg-zinc-100 justify-between h-20 items-center p-4">
      <div>
        <a href="#">
          <h1 className="font-gloria text-xanana-100 text-xl">
            Xananas’ Garden
          </h1>
        </a>
      </div>
      <AdminConfigs />
    </div>
  );
};

export default AdminHeader;
