import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const PermissionWrapper = ({ children, permission, fallback = null }) => {
  const { hasPermission, isManager } = useAuth();

  // Manager có tất cả quyền
  if (isManager()) {
    return children;
  }

  // Kiểm tra quyền cụ thể
  if (!permission || hasPermission(permission)) {
    return children;
  }

  return fallback;
};

export default PermissionWrapper;