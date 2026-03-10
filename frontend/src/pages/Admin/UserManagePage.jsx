import React from "react";
import { UserCard } from "@/components/admin";
const UserManagePage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Quản lý người dùng</h1>
      <p className="text-gray-600 mb-6">
        Quản lý thông tin người dùng, phân quyền và các hoạt động liên quan đến
        tài khoản.
      </p>
      <UserCard />
    </div>
  );
};

export default UserManagePage;
