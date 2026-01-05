const Task = require('../../models/task.model');
const Project = require('../../models/project.model');
const Team = require('../../models/team.model');
const User = require('../../models/user.model');

/**
 * Manager Analytics Helper
 * Xử lý dữ liệu quản lý nhân sự, dự án, thống kê hiệu suất
 */
class ManagerAnalyticsHelper {
  /**
   * Lấy danh sách dự án do manager phụ trách
   */
  async getManagerProjects(managerId) {
    try {
      const projects = await Project.find({
        $or: [
          { createdBy: managerId },
          { manager: managerId }
        ],
        deleted: false
      }).select('_id title content status listUser createdBy');

      return projects || [];
    } catch (error) {
      console.error('[Manager Analytics] Error getting projects:', error.message);
      return [];
    }
  }

  /**
   * Lấy danh sách thành viên trong dự án
   */
  async getProjectMembers(projectId) {
    try {
      // ƯTIÊN: Lấy từ Team.listUser (danh sách nhóm đầy đủ)
      const team = await Team.findOne({
        project_id: projectId,
        deleted: false
      }).populate('listUser', '_id fullName email');

      if (team && team.listUser && team.listUser.length > 0) {
        console.log('[DEBUG] Team found with', team.listUser.length, 'members');
        return team.listUser.map(user => ({
          _id: user._id,
          fullName: user.fullName || 'Không xác định',
          email: user.email || 'N/A',
          username: user.email ? user.email.split('@')[0] : 'N/A',
          role: 'Member'
        }));
      }

      console.log('[DEBUG] No team found, fallback to Project.listUser');

      // Fallback: Lấy từ Project.listUser + createdBy
      const project = await Project.findById(projectId);

      if (!project) {
        console.log('[DEBUG] Project not found:', projectId);
        return [];
      }

      // Tập hợp tất cả user IDs: Project.listUser + creator
      let userIds = [];
      
      // Thêm từ Project.listUser
      if (project.listUser && Array.isArray(project.listUser)) {
        userIds.push(...project.listUser.filter(id => id));
      }
      
      // Thêm người tạo (createdBy) nếu chưa có
      if (project.createdBy && !userIds.includes(project.createdBy)) {
        userIds.push(project.createdBy);
      }

      if (userIds.length === 0) {
        return [];
      }

      // Fetch user details
      const users = await User.find(
        { _id: { $in: userIds }, deleted: false },
        '_id fullName email'
      );

      const userMap = {};
      users.forEach(user => {
        userMap[user._id.toString()] = user;
      });

      // Return members
      const members = [];
      
      if (project.listUser && Array.isArray(project.listUser)) {
        project.listUser.forEach(userId => {
          if (userId) {
            const user = userMap[userId.toString()];
            members.push({
              _id: userId,
              fullName: user ? user.fullName : 'Không xác định',
              email: user ? user.email : 'N/A',
              username: user ? (user.email ? user.email.split('@')[0] : 'N/A') : 'N/A',
              role: 'Member'
            });
          }
        });
      }

      // Thêm createdBy
      if (project.createdBy) {
        const alreadyAdded = members.some(m => m._id.toString() === project.createdBy.toString());
        if (!alreadyAdded) {
          const user = userMap[project.createdBy.toString()];
          members.push({
            _id: project.createdBy,
            fullName: user ? user.fullName : 'Không xác định',
            email: user ? user.email : 'N/A',
            username: user ? (user.email ? user.email.split('@')[0] : 'N/A') : 'N/A',
            role: 'Creator'
          });
        }
      }

      console.log('[DEBUG] Final members from Project fallback:', members.length);
      return members;
    } catch (error) {
      console.error('[Manager Analytics] Error getting project members:', error.message);
      return [];
    }
  }

  /**
   * Thống kê hoàn thành & chậm trễ của project
   */
  async getProjectStats(projectId) {
    try {
      // Tasks được lưu trong Project collection với projectParentId trỏ đến dự án cha
      const tasks = await Project.find({
        projectParentId: projectId,
        deleted: false
      });

      console.log('[DEBUG] getProjectStats - projectId:', projectId);
      console.log('[DEBUG] getProjectStats - tasks found:', tasks.length);

      if (tasks.length === 0) {
        return {
          total: 0,
          completed: 0,
          pending: 0,
          inProgress: 0,
          onHold: 0,
          overdue: 0,
          completionRate: 0,
          overdueRate: 0
        };
      }

      const now = new Date();
      let completed = 0;
      let notStarted = 0;
      let onHold = 0;
      let overdue = 0;

      console.log('[DEBUG] ===== ANALYZING TASKS =====');
      console.log('[DEBUG] Total tasks found:', tasks.length);

      tasks.forEach(task => {
        const status = task.status?.toLowerCase() || '';
        const isOverdue = status !== 'completed' && task.timeFinish && new Date(task.timeFinish) < now;
        
        console.log(`[DEBUG] Task: "${task.title}" | Status: "${status}" | Overdue: ${isOverdue}`);
        
        // Mỗi task chỉ thuộc 1 trạng thái duy nhất
        if (status === 'completed') {
          completed++;
        } else if (isOverdue) {
          // Ưu tiên: task quá hạn chỉ tính vào "quá hạn", không tính vào trạng thái khác
          overdue++;
        } else if (status === 'on-hold' || status === 'on_hold' || status === 'onhold') {
          onHold++;
        } else {
          // Tất cả các trạng thái còn lại (not-started, in-progress, pending, v.v.) → chưa làm
          notStarted++;
        }
      });

      const stats = {
        total: tasks.length,
        completed,
        pending: notStarted,
        onHold,
        overdue,
        completionRate: Math.round((completed / tasks.length) * 100),
        overdueRate: Math.round((overdue / tasks.length) * 100)
      };

      console.log('[DEBUG] ===== FINAL STATS =====');
      console.log('[DEBUG] Completed:', completed);
      console.log('[DEBUG] Not Started:', notStarted);
      console.log('[DEBUG] On Hold:', onHold);
      console.log('[DEBUG] Overdue:', overdue);
      console.log('[DEBUG] Total should equal:', completed + notStarted + onHold + overdue);
      
      return stats;
    } catch (error) {
      console.error('[Manager Analytics] Error getting project stats:', error.message);
      return {};
    }
  }

  /**
   * Thống kê hiệu suất từng thành viên trong dự án
   */
  async getMemberPerformance(projectId) {
    try {
      // Tasks được lưu trong Project collection với projectParentId trỏ đến dự án cha
      // assignee_id là String không phải reference nên không populate được
      const tasks = await Project.find({
        projectParentId: projectId,
        deleted: false
      });

      if (tasks.length === 0) return [];

      // Group tasks by assignee - cần fetch user info manually vì assignee_id là string
      const memberStats = {};

      for (const task of tasks) {
        if (!task.assignee_id) continue;

        const memberId = task.assignee_id.toString();
        
        // Fetch user info if not cached
        if (!memberStats[memberId]) {
          const user = await User.findById(memberId, '_id fullName username');
          memberStats[memberId] = {
            userId: memberId,
            name: user ? (user.fullName || user.username) : 'Không xác định',
            total: 0,
            completed: 0,
            pending: 0,
            onHold: 0,
            overdue: 0
          };
        }

        memberStats[memberId].total++;

        const status = task.status?.toLowerCase() || '';
        const now = new Date();
        const isOverdue = status !== 'completed' && task.timeFinish && new Date(task.timeFinish) < now;
        
        // Mỗi task chỉ thuộc 1 trạng thái duy nhất
        if (status === 'completed') {
          memberStats[memberId].completed++;
        } else if (isOverdue) {
          memberStats[memberId].overdue++;
        } else if (status === 'on-hold' || status === 'on_hold' || status === 'onhold') {
          memberStats[memberId].onHold++;
        } else {
          memberStats[memberId].pending++;
        }
      }

      // Calculate completion rate & format
      const result = Object.values(memberStats).map(member => ({
        ...member,
        completionRate: Math.round((member.completed / member.total) * 100)
      }));

      return result.sort((a, b) => b.completionRate - a.completionRate);
    } catch (error) {
      console.error('[Manager Analytics] Error getting member performance:', error.message);
      return [];
    }
  }

  /**
   * Gợi ý phân công task - dựa vào workload của thành viên
   */
  async suggestTaskAssignment(projectId, numberOfSuggestions = 3) {
    try {
      // Lấy tasks chưa assign hoặc pending (dùng assignee_id)
      const unassignedTasks = await Project.find({
        projectParentId: projectId,
        $or: [
          { assignee_id: null },
          { status: 'pending' }
        ],
        deleted: false
      }).sort({ priority: -1, timeFinish: 1 }).limit(10);

      if (unassignedTasks.length === 0) {
        return [];
      }

      // Lấy workload của từng member
      const memberPerformance = await this.getMemberPerformance(projectId);

      if (memberPerformance.length === 0) {
        return [];
      }

      // Sort by completion rate (assign cho người có completion rate cao) + inProgress count (assign cho người ít tasks)
      const sortedMembers = memberPerformance.sort((a, b) => {
        const aScore = (a.completionRate / 100) - (a.inProgress / 10);
        const bScore = (b.completionRate / 100) - (b.inProgress / 10);
        return bScore - aScore;
      });

      // Gợi ý phân công
      const suggestions = [];
      unassignedTasks.slice(0, numberOfSuggestions).forEach((task, index) => {
        const assignMember = sortedMembers[index % sortedMembers.length];
        suggestions.push({
          taskId: task._id,
          taskTitle: task.title,
          suggestedAssignee: assignMember.name,
          assigneeId: assignMember.userId,
          reason: `${assignMember.name} đã hoàn thành ${assignMember.completionRate}% tasks và hiện có ${assignMember.inProgress} task đang làm`
        });
      });

      return suggestions;
    } catch (error) {
      console.error('[Manager Analytics] Error suggesting task assignment:', error.message);
      return [];
    }
  }

  /**
   * Lấy danh sách task quá hạn trong dự án
   */
  async getOverdueTasks(projectId) {
    try {
      const now = new Date();
      // Tasks được lưu trong Project collection với projectParentId trỏ đến dự án cha
      // assignee_id là String không phải reference nên không populate được
      const overdueTasks = await Project.find({
        projectParentId: projectId,
        status: { $ne: 'completed' },
        timeFinish: { $lt: now },
        deleted: false
      })
        .sort({ timeFinish: 1 })
        .limit(10);

      // Fetch user info manually
      const tasksWithAssignee = [];
      for (const task of overdueTasks) {
        let assigneeInfo = null;
        if (task.assignee_id) {
          assigneeInfo = await User.findById(task.assignee_id, '_id fullName username');
        }
        tasksWithAssignee.push({
          ...task.toObject(),
          assignee: assigneeInfo ? { 
            _id: assigneeInfo._id, 
            fullName: assigneeInfo.fullName, 
            username: assigneeInfo.username 
          } : null
        });
      }

      return tasksWithAssignee;
    } catch (error) {
      console.error('[Manager Analytics] Error getting overdue tasks:', error.message);
      return [];
    }
  }

  /**
   * Format dữ liệu để trả về trong chat
   */
  formatProjectMembers(members) {
    if (!members || members.length === 0) {
      return 'Không có thành viên nào trong dự án';
    }

    let result = `📋 **Danh sách thành viên (${members.length} người)**:\n\n`;
    members.forEach((member, idx) => {
      // member đã là object với đầy đủ thông tin từ getProjectMembers
      const name = member.fullName || 'Không xác định';
      const username = member.username || 'N/A';
      const email = member.email || 'N/A';
      
      result += `${idx + 1}. **${name}** (@${username})\n`;
      result += `   - Email: ${email}\n`;
      result += `   - Vai trò: ${member.role || 'Member'}\n\n`;
    });

    return result;
  }

  /**
   * Format stats để trả về trong chat
   */
  formatProjectStats(stats, projectName = 'Dự án') {
    if (!stats || stats.total === 0) {
      return `📊 **${projectName}** không có task nào`;
    }

    return `📊 **Thống kê ${projectName}:**
    
• **Tổng task**: ${stats.total}
• **Đã hoàn thành**: ${stats.completed}
• **Tạm dừng**: ${stats.onHold || 0}
• **Chưa làm**: ${stats.pending}
• **Quá hạn**: ${stats.overdue}`;
  }

  /**
   * Format member performance để trả về
   */
  formatMemberPerformance(members) {
    if (!members || members.length === 0) {
      return 'Không có dữ liệu thành viên';
    }

    let result = `👥 **Hiệu suất thành viên:**\n\n`;
    members.forEach((member, idx) => {
      result += `${idx + 1}. **${member.name}**\n`;
      result += `   - Hoàn thành: ${member.completed}/${member.total}\n`;
      result += `   - Tạm dừng: ${member.onHold || 0} | Chưa làm: ${member.pending} | Quá hạn: ${member.overdue}\n\n`;
    });

    return result;
  }

  /**
   * Format suggestions để trả về
   */
  formatAssignmentSuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) {
      return 'Không có gợi ý phân công (tất cả tasks đã được phân công)';
    }

    let result = `💡 **Gợi ý phân công công việc:**\n\n`;
    suggestions.forEach((suggestion, idx) => {
      result += `${idx + 1}. **${suggestion.taskTitle}**\n`;
      result += `   → Gợi ý: ${suggestion.suggestedAssignee}\n`;
      result += `   📝 ${suggestion.reason}\n\n`;
    });

    return result;
  }

  /**
   * Format overdue tasks
   */
  formatOverdueTasks(tasks) {
    if (!tasks || tasks.length === 0) {
      return 'Tất cả tasks đều trong deadline ✅';
    }

    let result = `🔴 **Tasks quá hạn (${tasks.length} cái):**\n\n`;
    tasks.forEach((task, idx) => {
      const daysOverdue = Math.floor((new Date() - new Date(task.timeFinish)) / (1000 * 60 * 60 * 24));
      result += `${idx + 1}. **${task.title}**\n`;
      result += `   - Người làm: ${task.assignee ? task.assignee.fullName : 'Chưa phân công'}\n`;
      result += `   - Quá hạn: ${daysOverdue} ngày\n`;
      result += `   - Deadline: ${new Date(task.timeFinish).toLocaleDateString('vi-VN')}\n\n`;
    });

    return result;
  }
}

module.exports = new ManagerAnalyticsHelper();
