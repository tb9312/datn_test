import { apiClientV1 } from './api';

export const teamService = {
  // Lấy danh sách teams
  getTeams: (params) => {
    return apiClientV1.get('/teams', { params });
  },

  // Lấy chi tiết team
  getTeamDetail: (id) => {
    return apiClientV1.get(`/teams/detail/${id}`);
  },

  // Tạo team từ project
  createTeam: (data) => {
    return apiClientV1.post('/teams/create', data);
  },

  // Cập nhật team
  updateTeam: (id, data) => {
    return apiClientV1.patch(`/teams/edit/${id}`, data);
  },

  // Xóa team (soft delete)
  deleteTeam: (id) => {
    return apiClientV1.patch(`/teams/delete/${id}`);
  },

  // Thay đổi trạng thái active
  toggleActive: (id, isActive) => {
    return apiClientV1.patch(`/teams/isActive/${id}`, { isActive });
  },

  // Lấy danh sách projects để tạo team
  getProjectsForTeam: () => {
    return apiClientV1.get('/projects');
  }
};