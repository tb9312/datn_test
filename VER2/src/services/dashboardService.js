import { apiClientV1, apiClientV3 } from './api';

export const dashboardService = {
  async getDashboardData() {
    const userStr = localStorage.getItem('user');
    let role = 'USER';
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        role = (user?.role || 'USER').toUpperCase();
      } catch {}
    }
    const data =
      role === 'MANAGER'
        ? await apiClientV3.get('/dashboard')
        : await apiClientV1.get('/dashboard');

    return data;
  },

  // Lấy 3 notifications đơn giản - CHO CẢ USER VÀ MANAGER
  async getSimpleNotifications(limit = 3) {
    try {
      console.log('📢 Fetching simple notifications for dashboard...');
      
      const response = await apiClientV1.get('/notifications', {
        params: { 
          limit, 
          page: 1 
        }
      });
      
      console.log('✅ Dashboard notifications:', response);
      
      // API trả về: {code: 200, success: true, data: [...], total: ...}
      if (response.success && response.data && Array.isArray(response.data)) {
        // Chỉ lấy những field cần thiết
        return response.data.slice(0, limit).map(noti => ({
          id: noti._id,
          message: noti.message || 'Thông báo',
          createdAt: noti.createdAt,
          type: noti.type || 'SYSTEM',
          priority: noti.priority || 'normal',
          isRead: noti.isRead || false
        }));
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Error fetching dashboard notifications:', error);
      return [];
    }
  },

  // Format thời gian ngắn gọn
  formatTimeShort(timestamp) {
    if (!timestamp) return 'Vừa xong';
    
    try {
      const now = new Date();
      const time = new Date(timestamp);
      
      if (isNaN(time.getTime())) {
        return 'Vừa xong';
      }
      
      const diffInMinutes = Math.floor((now - time) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Vừa xong';
      if (diffInMinutes < 60) return `${diffInMinutes}p`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}g`;
      if (diffInMinutes < 43200) return `${Math.floor(diffInMinutes / 1440)}d`;
      return `${Math.floor(diffInMinutes / 43200)}m`;
    } catch (error) {
      return 'Vừa xong';
    }
  },

  // Lấy màu cho type
  getTypeColor(type) {
    const colors = {
      TASK: 'blue',
      PROJECT: 'green',
      SYSTEM: 'purple',
      COMMENT: 'cyan',
      CHAT: 'pink',
      DEADLINE: 'orange',
      URGENT: 'red',
      MEETING: 'magenta',
      default: 'default'
    };
    return colors[type] || colors.default;
  },

  // Lấy màu cho priority
  getPriorityColor(priority) {
    const colors = {
      high: 'red',
      medium: 'orange',
      low: 'blue',
      normal: 'default'
    };
    return colors[priority] || colors.normal;
  },


  formatDashboardData(apiResponse, userRole) {
    if (!apiResponse) {
      return null;
    }
    if (apiResponse.code && apiResponse.code !== 200) {
      return null;
    }
    if (userRole === 'USER') {
      return {
        tasks: {
          totalTasks: apiResponse.tasks?.totalTasks || 0,
          pendingTasks: apiResponse.tasks?.pendingTasks || 0,
          productivity: apiResponse.tasks?.productivity || 0,
          chartData: apiResponse.tasks?.chartData || {
            todo: 0,
            'in-progress': 0,
            done: 0,
            backlog: 0,
          },
        },
        projects: {
          totalProjects: apiResponse.projects?.totalProjects || 0,
          pendingProjects: apiResponse.projects?.pendingProjetcs || 0,
          teamProjects: apiResponse.projects?.teamProjects || 0,
          productivityProject: apiResponse.projects?.productivityProject || 0,
          chartData2: apiResponse.projects?.chartData2 || {
            'not-started': 0,
            'in-progress': 0,
            'on-hold': 0,
            completed: 0,
            cancelled: 0,
          },
        },
      };
    }
    if (userRole === 'MANAGER') {
      const formattedData = {
        tasks: {
          totalTasks: apiResponse.tasks?.totalTasks || 0,
          pendingTasks: apiResponse.tasks?.pendingTasks || 0,
          productivity: apiResponse.tasks?.productivity || 0,
          chartData: apiResponse.tasks?.chartData || {
            todo: 0,
            'in-progress': 0,
            done: 0,
            backlog: 0,
          },
        },
        projects: {
          totalProjects: apiResponse.projects?.totalProjects || 0,
          totalPM: apiResponse.projects?.totalPM || 0,
          pendingProjects: apiResponse.projects?.pendingProjetcs || 0,
          teamProjects: apiResponse.projects?.teamProjects || 0,
          productivityProject: apiResponse.projects?.productivityProject || 0,
          chartData2: apiResponse.projects?.chartData2 || {
            'not-started': 0,
            'in-progress': 0,
            'on-hold': 0,
            completed: 0,
            cancelled: 0,
          },
        },
      };
      return formattedData;
    }

    return null;
  },

  // Lấy stat cards data
  getStatCardsData(dashboardData, userRole) {
    if (!dashboardData) {
      return {};
    }
    if (userRole === 'USER') {
      return {
        totalTasks: dashboardData.tasks?.totalTasks || 0,
        pendingTasks: dashboardData.tasks?.pendingTasks || 0,
        teamTasks: dashboardData.tasks?.teamTasks || 0,
        productivity: dashboardData.tasks?.productivity || 0,
      };
    }
    if (userRole === 'MANAGER') {
      return {
        totalProjects: dashboardData.projects?.totalProjects || 0,
        totalPM: dashboardData.projects?.totalPM || 0,
        pendingProjects: dashboardData.projects?.pendingProjetcs || 0,
        teamProjects: dashboardData.projects?.teamProjects || 0,
        productivityProject: dashboardData.projects?.productivityProject || 0,
      };
    }

    return {};
  },

  // Lấy task distribution data
  getTaskDistributionData(dashboardData) {
    if (!dashboardData?.tasks?.chartData) {
      return {
        labels: ['Todo', 'In Progress', 'Done', 'Backlog'],
        data: [0, 0, 0, 0],
        colors: ['#faad14', '#1890ff', '#52c41a', '#722ed1'],
      };
    }
    const chart = dashboardData.tasks.chartData;
    return {
      labels: ['Todo', 'In Progress', 'Done', 'Backlog'],
      data: [chart.todo || 0, chart['in-progress'] || 0, chart.done || 0, chart.backlog || 0],
      colors: ['#faad14', '#1890ff', '#52c41a', '#722ed1'],
    };
  },

  // Lấy project distribution data
  getProjectDistributionData(dashboardData) {
    const defaultResult = {
      labels: ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
      data: [0, 0, 0, 0, 0],
      colors: ['#faad14', '#1890ff', '#722ed1', '#52c41a', '#ff4d4f'],
    };

    if (!dashboardData) {
      console.log('❌ No dashboard data');
      return defaultResult;
    }
    const chartData2 = dashboardData.projects?.chartData2;

    if (!chartData2) {
      console.log('❌ No chartData2 found');
      return defaultResult;
    }
    let chartObj = chartData2;

    if (typeof chartObj === 'string') {
      try {
        chartObj = JSON.parse(chartObj);
      } catch (e) {
        console.error('❌ Failed to parse chartData2 string:', e);
      }
    }

    // Lấy dữ liệu
    const data = [
      chartObj['not-started'] || 0,
      chartObj['in-progress'] || 0,
      chartObj['on-hold'] || 0,
      chartObj.completed || 0,
      chartObj.cancelled || 0,
    ];
    return {
      labels: ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
      data: data,
      colors: ['#faad14', '#1890ff', '#722ed1', '#52c41a', '#ff4d4f'],
    };
  },

  // XÓA HẲN getSampleData

  // Các hàm khác giữ nguyên
  getProjectProgressData(dashboardData) {
    return [
      { name: 'Website Redesign', progress: dashboardData?.projects?.productivityProject || 75 },
      { name: 'Mobile App', progress: 45 },
      { name: 'API Development', progress: 90 },
    ];
  },

  
};