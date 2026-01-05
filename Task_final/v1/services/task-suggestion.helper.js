const Task = require('../../models/task.model');

/**
 * Task Suggestion Helper - Phân tích và gợi ý tasks cho người dùng
 * Phiên bản này bổ sung cách tiếp cận giống RAG (Retrieval-Augmented)
 * cho dữ liệu task: xây dựng "index" đơn giản và tính độ tương đồng
 * để xếp hạng / gợi ý task, nhưng vẫn giữ nguyên API & tính năng cũ.
 */
class TaskSuggestionHelper {
  /**
   * Chuẩn hoá text (bỏ dấu, lowercase, bỏ ký tự đặc biệt)
   * Dùng cho bước embedding / matching theo kiểu RAG.
   */
  normalizeText(text = '') {
    return String(text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Simple "embedding" cho task: đếm tần suất từ khoá
   * (giống TF-IDF đơn giản, phục vụ retrieval).
   */
  buildTaskEmbedding(task) {
    const textParts = [
      task.title || '',
      task.content || '',
      task.status || '',
      task.priority || '',
    ];

    const normalized = this.normalizeText(textParts.join(' '));
    const words = normalized.split(' ').filter((w) => w.length > 1);

    const freq = {};
    for (const w of words) {
      freq[w] = (freq[w] || 0) + 1;
    }
    return freq;
  }

  /**
   * Tính độ tương đồng cosine-like giữa hai embedding
   */
  calculateEmbeddingSimilarity(a, b) {
    if (!a || !b) return 0;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    const common = aKeys.filter((k) => bKeys.includes(k));
    if (common.length === 0) return 0;

    let dot = 0;
    let aNorm = 0;
    let bNorm = 0;

    for (const k of common) {
      dot += (a[k] || 0) * (b[k] || 0);
    }
    for (const k of aKeys) {
      aNorm += (a[k] || 0) ** 2;
    }
    for (const k of bKeys) {
      bNorm += (b[k] || 0) ** 2;
    }

    if (!aNorm || !bNorm) return 0;
    return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
  }

  /**
   * Xây dựng "index" cho danh sách task – mỗi task có embedding riêng
   */
  buildTaskIndex(tasks = []) {
    return tasks.map((task) => ({
      task,
      embedding: this.buildTaskEmbedding(task),
    }));
  }

  /**
   * Truy vấn index theo kiểu RAG: nhận query text, trả về danh sách
   * task được xếp theo độ liên quan (similarity).
   * Có thể truyền filterFn để giới hạn theo điều kiện nghiệp vụ.
   */
  retrieveTasksByQuery(taskIndex, query, filterFn = null, limit = 50) {
    if (!Array.isArray(taskIndex) || taskIndex.length === 0) return [];

    const queryEmbedding = this.buildTaskEmbedding({
      title: query,
      content: query,
    });

    const scored = [];
    for (const item of taskIndex) {
      const task = item.task;
      if (filterFn && !filterFn(task)) continue;

      const similarity = this.calculateEmbeddingSimilarity(
        queryEmbedding,
        item.embedding
      );

      if (similarity > 0) {
        scored.push({ task, similarity });
      }
    }

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((x) => x.task);
  }

  /**
   * Lấy tất cả tasks của user (chưa xóa)
   */
  async getUserTasks(userId) {
    try {
      const tasks = await Task.find({
        createdBy: userId,
        deleted: false,
      }).sort({ createdAt: -1 });
      
      return tasks;
    } catch (error) {
      console.error('Error getting user tasks:', error);
      return [];
    }
  }

  /**
   * Phân tích tasks và trả về các loại:
   * - todayTasks: Tasks cần làm hôm nay
   * - upcomingDeadlines: Tasks sắp đến deadline (trong 3 ngày)
   * - overdueTasks: Tasks đã quá hạn
   * - highPriorityTasks: Tasks có độ ưu tiên cao
   */
  async analyzeTasks(userId) {
    const tasks = await this.getUserTasks(userId);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const todayTasks = [];
    const upcomingDeadlines = [];
    const overdueTasks = [];
    const highPriorityTasks = [];
    const inProgressTasks = [];
    const notStartedTasks = [];

    tasks.forEach(task => {
      // Phân loại theo deadline
      if (task.timeFinish) {
        const deadline = new Date(task.timeFinish);
        deadline.setHours(0, 0, 0, 0);

        if (deadline.getTime() === today.getTime()) {
          // Deadline hôm nay
          todayTasks.push(task);
        } else if (deadline < today) {
          // Đã quá hạn - chỉ đếm task chưa hoàn thành
          const status = (task.status || '').toLowerCase();
          const isCompleted = status === 'hoàn thành' || 
                            status === 'hoan thanh' || 
                            status === 'done' || 
                            status === 'completed';
          if (!isCompleted) {
            overdueTasks.push(task);
          }
        } else if (deadline <= threeDaysLater && deadline > today) {
          // Sắp đến deadline (trong 3 ngày)
          upcomingDeadlines.push(task);
        }
      }

      // Phân loại theo độ ưu tiên
      if (task.priority === 'Cao' || task.priority === 'cao') {
        highPriorityTasks.push(task);
      }

      // Phân loại theo trạng thái
      if (task.status === 'Đang thực hiện' || task.status === 'đang thực hiện') {
        inProgressTasks.push(task);
      } else if (task.status === 'Chưa bắt đầu' || task.status === 'chưa bắt đầu' || 
                 task.status === 'Tồn đọng' || task.status === 'tồn đọng') {
        notStartedTasks.push(task);
      }
    });

    return {
      total: tasks.length,
      todayTasks,
      upcomingDeadlines,
      overdueTasks,
      highPriorityTasks,
      inProgressTasks,
      notStartedTasks,
      completedTasks: tasks.filter(t => {
        const status = (t.status || '').toLowerCase();
        return status === 'hoàn thành' || 
               status === 'hoan thanh' || 
               status === 'done' || 
               status === 'completed';
      }),
      allTasks: tasks,
    };
  }

  /**
   * Format task để hiển thị
   */
  formatTaskForDisplay(task) {
    const deadline = task.timeFinish ? new Date(task.timeFinish).toLocaleDateString('vi-VN') : 'Chưa có';
    const priority = task.priority || 'Không xác định';
    const status = task.status || 'Không xác định';
    
    return {
      id: task._id,
      title: task.title,
      status,
      priority,
      deadline,
      content: task.content || '',
    };
  }

  /**
   * Tạo gợi ý nhắc nhở dựa trên phân tích tasks
   */
  generateSuggestionMessage(analysis) {
    let message = '';
    const suggestions = [];
    
    // Danh sách task chưa hoàn thành (phục vụ trả lời chi tiết)
    // Lọc bỏ task có status: done, completed, hoàn thành, Hoàn thành
    const incompleteTasksRaw = analysis.allTasks.filter(t => {
      const status = (t.status || '').toLowerCase();
      return status !== 'hoàn thành' && 
             status !== 'hoan thanh' && 
             status !== 'done' && 
             status !== 'completed';
    });
    const incompleteTasks = incompleteTasksRaw.map(t => this.formatTaskForDisplay(t));

    // LOẠI BỎ: Nhắc về tasks quá hạn (không hiển thị bảng cảnh báo)
    // if (analysis.overdueTasks.length > 0) {
    //   suggestions.push({
    //     type: 'warning',
    //     title: `⚠️ Bạn có ${analysis.overdueTasks.length} task đã quá hạn!`,
    //     tasks: analysis.overdueTasks.slice(0, 5).map(t => this.formatTaskForDisplay(t)),
    //     message: `Có ${analysis.overdueTasks.length} task đã quá hạn và chưa hoàn thành. Bạn nên ưu tiên hoàn thành các task này.`,
    //   });
    // }

    // Nhắc về tasks hôm nay
    if (analysis.todayTasks.length > 0) {
      suggestions.push({
        type: 'info',
        title: `📅 Bạn có ${analysis.todayTasks.length} task cần làm hôm nay`,
        tasks: analysis.todayTasks.map(t => this.formatTaskForDisplay(t)),
        message: `Hôm nay bạn có ${analysis.todayTasks.length} task đến hạn. Hãy kiểm tra và hoàn thành chúng.`,
      });
    }

    // Nhắc về deadlines sắp đến
    if (analysis.upcomingDeadlines.length > 0) {
      suggestions.push({
        type: 'reminder',
        title: `⏰ Có ${analysis.upcomingDeadlines.length} task sắp đến deadline (trong 3 ngày tới)`,
        tasks: analysis.upcomingDeadlines.slice(0, 5).map(t => this.formatTaskForDisplay(t)),
        message: `Bạn có ${analysis.upcomingDeadlines.length} task sắp đến deadline trong 3 ngày tới. Hãy lên kế hoạch hoàn thành.`,
      });
    }

    // Nhắc về tasks ưu tiên cao
    if (analysis.highPriorityTasks.length > 0) {
      const incompleteHighPriority = analysis.highPriorityTasks.filter(t => {
        const status = (t.status || '').toLowerCase();
        return status !== 'hoàn thành' && 
               status !== 'hoan thanh' && 
               status !== 'done' && 
               status !== 'completed';
      });
      
      if (incompleteHighPriority.length > 0) {
        suggestions.push({
          type: 'priority',
          title: `🔥 Bạn có ${incompleteHighPriority.length} task ưu tiên cao chưa hoàn thành`,
          tasks: incompleteHighPriority.slice(0, 5).map(t => this.formatTaskForDisplay(t)),
          message: `Có ${incompleteHighPriority.length} task có độ ưu tiên cao đang chưa hoàn thành.`,
        });
      }
    }

    // Tổng hợp
    if (suggestions.length === 0) {
      const completedCount = analysis.completedTasks.length;
      const totalIncomplete = analysis.total - completedCount;
      
      if (totalIncomplete === 0) {
        return {
          message: '🎉 Tuyệt vời! Bạn đã hoàn thành tất cả các task. Không có task nào cần làm vào lúc này.',
          suggestions: [],
          summary: {
            total: analysis.total,
            completed: completedCount,
            incomplete: 0,
          },
          incompleteTasks: [],
        };
      } else {
        return {
          message: `📊 Tổng quan:\n• Tổng số task: ${analysis.total}\n• Đã hoàn thành: ${completedCount}\n• Chưa hoàn thành: ${totalIncomplete}\n\nBạn đang quản lý tốt công việc của mình!`,
          suggestions: [],
          summary: {
            total: analysis.total,
            completed: completedCount,
            incomplete: totalIncomplete,
          },
          incompleteTasks,
        };
      }
    }

    // Tạo message tổng hợp
    message = '📋 **Tóm tắt công việc của bạn:**\n\n';
    message += `• Tổng số task: ${analysis.total}\n`;
    message += `• Task quá hạn: ${analysis.overdueTasks.length}\n`;
    message += `• Task hôm nay: ${analysis.todayTasks.length}\n`;
    message += `• Task sắp đến deadline: ${analysis.upcomingDeadlines.length}\n`;
    
    const incompleteHighPriorityCount = analysis.highPriorityTasks.filter(t => {
      const status = (t.status || '').toLowerCase();
      return status !== 'hoàn thành' && 
             status !== 'hoan thanh' && 
             status !== 'done' && 
             status !== 'completed';
    }).length;
    
    message += `• Task ưu tiên cao: ${incompleteHighPriorityCount}\n\n`;

    return {
      message,
      suggestions,
      summary: {
        total: analysis.total,
        overdue: analysis.overdueTasks.length,
        today: analysis.todayTasks.length,
        upcoming: analysis.upcomingDeadlines.length,
        highPriority: incompleteHighPriorityCount,
        completed: analysis.completedTasks.length,
      },
      incompleteTasks,
    };
  }

  /**
   * Xây dựng kế hoạch trong ngày (daily plan) dựa trên phân tích tasks
   * Trả về các nhóm: sáng, chiều, tối
   */
  buildDailyPlan(analysis) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const isIncomplete = (task) => 
      task.status !== 'Hoàn thành' && task.status !== 'hoàn thành';

    // Nhóm 1: Rất gấp – quá hạn hoặc deadline hôm nay
    const urgentTasks = [
      ...(analysis.overdueTasks || []),
      ...(analysis.todayTasks || []),
    ].filter(isIncomplete);

    // Nhóm 2: Quan trọng – ưu tiên cao, đang làm hoặc sắp deadline
    const importantTasks = (analysis.highPriorityTasks || []).filter((task) => {
      if (!isIncomplete(task)) return false;
      const deadline = task.timeFinish ? new Date(task.timeFinish) : null;
      const isSoon =
        deadline &&
        deadline.getTime() >= today.getTime() &&
        deadline.getTime() <= today.getTime() + 3 * 24 * 60 * 60 * 1000;
      const isInProgress =
        task.status === 'Đang thực hiện' || task.status === 'đang thực hiện';
      return isSoon || isInProgress;
    });

    // Nhóm 3: Có thể chuẩn bị trước – các task sắp đến deadline khác
    const prepareTasks = (analysis.upcomingDeadlines || []).filter(isIncomplete);

    // Loại bỏ trùng lặp theo _id
    const uniqById = (tasks) => {
      const map = new Map();
      tasks.forEach((t) => {
        const id = String(t._id);
        if (!map.has(id)) map.set(id, t);
      });
      return Array.from(map.values());
    };

    const urgent = uniqById(urgentTasks);
    const important = uniqById(importantTasks);
    const prepare = uniqById(
      prepareTasks.filter(
        (t) =>
          !urgent.find((u) => String(u._id) === String(t._id)) &&
          !important.find((u) => String(u._id) === String(t._id))
      )
    );

    // Phân bổ vào sáng / chiều / tối
    const morning = [];
    const afternoon = [];
    const evening = [];

    urgent.slice(0, 3).forEach((t) => morning.push(this.formatTaskForDisplay(t)));
    urgent.slice(3, 6).forEach((t) => afternoon.push(this.formatTaskForDisplay(t)));

    important.slice(0, 2).forEach((t) => {
      if (morning.length < 4) morning.push(this.formatTaskForDisplay(t));
      else afternoon.push(this.formatTaskForDisplay(t));
    });

    prepare.slice(0, 3).forEach((t) => evening.push(this.formatTaskForDisplay(t)));

    return {
      morning,
      afternoon,
      evening,
    };
  }

  /**
   * Xếp hạng task theo mức độ ưu tiên (priority helper)
   */
  rankTasksByPriority(analysis, limit = 10) {
    const now = new Date();
    // Lọc task chưa hoàn thành - nghiêm ngặt hơn
    const incompleteTasks = (analysis.allTasks || []).filter((t) => {
      const status = (t.status || '').toLowerCase();
      return status !== 'hoàn thành' && 
             status !== 'hoan thanh' && 
             status !== 'done' && 
             status !== 'completed';
    });

    // Xây index cho RAG trên dữ liệu task chưa hoàn thành
    const taskIndex = this.buildTaskIndex(incompleteTasks);

    const getPriorityWeight = (priority) => {
      if (!priority) return 1;
      const p = priority.toLowerCase();
      if (p.includes('cao') || p.includes('high')) return 3;
      if (p.includes('trung') || p.includes('medium')) return 2;
      return 1;
    };

    const getDeadlineWeight = (task) => {
      if (!task.timeFinish) return 0;
      const deadline = new Date(task.timeFinish);
      const diffDays = Math.floor(
        (deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (diffDays < 0) return 3; // quá hạn
      if (diffDays === 0) return 2; // hôm nay
      if (diffDays <= 3) return 1; // trong 3 ngày
      return 0;
    };

    const getStatusWeight = (status) => {
      if (!status) return 1;
      const s = status.toLowerCase();
      if (s.includes('đang thực hiện') || s.includes('in-progress')) return 2;
      if (s.includes('chưa bắt đầu') || s.includes('tồn đọng') || s.includes('backlog')) return 1;
      return 1;
    };

    // Query tổng quát cho việc "nên làm task nào trước" – dùng cho similarity
    const queryForPriority =
      'task quan trong, uu tien cao, sap den deadline, qua han, nen lam truoc';

    const queryEmbedding = this.buildTaskEmbedding({
      title: queryForPriority,
      content: queryForPriority,
    });

    const ranked = taskIndex.map((item) => {
      const task = item.task;
      const priorityW = getPriorityWeight(task.priority);
      const deadlineW = getDeadlineWeight(task);
      const statusW = getStatusWeight(task.status);

      // ƯU TIÊN: Priority trước, Deadline sau
      // Priority weight cao hơn (x5), Deadline weight thấp hơn (x2)
      const baseScore = priorityW * 5 + deadlineW * 2 + statusW;
      
      // Điểm similarity RAG giữa query "ưu tiên" và task
      const similarity = this.calculateEmbeddingSimilarity(
        queryEmbedding,
        item.embedding
      );

      // Kết hợp: ưu tiên vẫn bám logic cũ, nhưng có boost theo similarity
      const score = baseScore + similarity * 3;

      // Không cần reasons nữa (sẽ bỏ trong output)
      const reasons = [];

      return {
        task: this.formatTaskForDisplay(task),
        score,
        reasons, // Giữ để không break code, nhưng sẽ không hiển thị
      };
    });

    return ranked
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

module.exports = new TaskSuggestionHelper();


