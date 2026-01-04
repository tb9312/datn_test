import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PermissionWrapper from '../../components/Common/PermissionWrapper';
import PersonalReports from './PersonalReports';
import FullReports from './FullReports'; // Giữ nguyên component Reports cũ, đổi tên thành FullReports

const Reports = () => {
  const { hasPermission } = useAuth();

  // Nếu user chỉ có quyền xem báo cáo cá nhân
  if (hasPermission('view_own_reports') && !hasPermission('view_team_reports') && !hasPermission('view_system_reports')) {
    return <PersonalReports />;
  }

  // Nếu là manager hoặc admin, hiển thị báo cáo đầy đủ
  return <FullReports />;
};

export default Reports;