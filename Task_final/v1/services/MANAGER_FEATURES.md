/**
 * MANAGER ANALYTICS CHATBOT FEATURES
 * 
 * Tính năng mới cho người quản lý (MANAGER role)
 * Cho phép xem và quản lý thông tin về team, task completion stats, và gợi ý phân công
 */

// ============================================================
// 1️⃣ LIỆT KÊ THÀNH VIÊN TRONG DỰ ÁN
// ============================================================
// 
// User Query Examples:
// - "Ai trong team?"
// - "Danh sách thành viên"
// - "Co ai trong dự án?"
// - "Team members"
// - "Dũng thi tham gia team nào?"
// 
// Chat Flow:
// 1. User sends query → RAG service
// 2. detectIntent() matches keywords: "ai trong team", "thanh vien", "danh sach thanh vien"
// 3. Intent = 'team_members'
// 4. generateResponse() calls manager-analytics.helper.getManagerProjects(userId)
// 5. Gets project members: managerAnalyticsHelper.getProjectMembers(projectId)
// 6. Format response: managerAnalyticsHelper.formatProjectMembers(members)
// 7. Returns formatted list with names, emails, roles
//
// Response Example:
// ┌─────────────────────────────────────────┐
// │ 📋 **Danh sách thành viên (3 người):**  │
// │                                         │
// │ 1. **Nguyễn Văn A** (@nguyenvana)       │
// │    - Email: a@email.com                 │
// │    - Vai trò: Developer                 │
// │                                         │
// │ 2. **Trần Thị B** (@tranthib)           │
// │    - Email: b@email.com                 │
// │    - Vai trò: Designer                  │
// │                                         │
// │ 3. **Lý Văn C** (@lyvanc)               │
// │    - Email: c@email.com                 │
// │    - Vai trò: PM                        │
// └─────────────────────────────────────────┘

// ============================================================
// 2️⃣ THỐNG KÊ HOÀN THÀNH & CHẬM TRỄ DỰ ÁN
// ============================================================
// 
// User Query Examples:
// - "Tiến độ dự án?"
// - "Ai chậm deadline?"
// - "Task quá hạn bao nhiêu?"
// - "Tỷ lệ hoàn thành bao nhiêu?"
// - "Progress report"
// - "Overdue tasks"
// 
// Chat Flow:
// 1. User sends query → RAG service
// 2. detectIntent() matches keywords: "tien do", "ai cham", "task cham", "hoan thanh", etc
// 3. Intent = 'project_stats'
// 4. generateResponse() calls:
//    - managerAnalyticsHelper.getProjectStats(projectId) → overall stats
//    - managerAnalyticsHelper.getMemberPerformance(projectId) → per-member stats
//    - managerAnalyticsHelper.getOverdueTasks(projectId) → list of overdue tasks
// 5. Format response with multiple sections
// 6. Returns: overall stats + member performance + overdue tasks
//
// Response Example:
// ┌──────────────────────────────────────────────────┐
// │ 📊 **Thống kê Dự án Web Development:**           │
// │                                                  │
// │ • **Tổng task**: 20                              │
// │ • **Đã hoàn thành**: 14 (70%)                    │
// │ • **Đang làm**: 4                                │
// │ • **Chưa làm**: 2                                │
// │ • **Quá hạn**: 2 (10%)                           │
// │                                                  │
// │ ⚠️ Cần tăng tốc độ                               │
// │                                                  │
// │ 👥 **Hiệu suất thành viên:**                     │
// │                                                  │
// │ 1. **Nguyễn Văn A**                              │
// │    - Hoàn thành: 85% (8/10)                      │
// │    - Đang làm: 2 | Chưa làm: 0 | Quá hạn: 0    │
// │                                                  │
// │ 2. **Trần Thị B**                                │
// │    - Hoàn thành: 60% (3/5)                       │
// │    - Đang làm: 2 | Chưa làm: 0 | Quá hạn: 1    │
// │                                                  │
// │ 3. **Lý Văn C**                                  │
// │    - Hoàn thành: 33% (2/6)                       │
// │    - Đang làm: 0 | Chưa làm: 2 | Quá hạn: 1    │
// │                                                  │
// │ 🔴 **Tasks quá hạn (2 cái):**                    │
// │                                                  │
// │ 1. **Implement login**                           │
// │    - Người làm: Lý Văn C                         │
// │    - Quá hạn: 3 ngày                             │
// │    - Deadline: 15/12/2024                        │
// │                                                  │
// │ 2. **Design homepage**                           │
// │    - Người làm: Trần Thị B                       │
// │    - Quá hạn: 1 ngày                             │
// │    - Deadline: 17/12/2024                        │
// └──────────────────────────────────────────────────┘

// ============================================================
// 3️⃣ GỢI Ý PHÂN CÔNG CÔNG VIỆC
// ============================================================
// 
// User Query Examples:
// - "Ai nên làm cái task này?"
// - "Phân công công việc"
// - "Gan task cho ai?"
// - "Task assignment suggestions"
// - "Ai có thời gian không?"
// 
// Chat Flow:
// 1. User sends query → RAG service
// 2. detectIntent() matches keywords: "ai lam", "phan cong", "gan task", "assign", etc
// 3. Intent = 'task_assignment'
// 4. generateResponse() calls:
//    - managerAnalyticsHelper.suggestTaskAssignment(projectId, 5) → get suggestions
//    - Each suggestion based on member's completion rate and current workload
//    - Algorithm: Sort by (completionRate/100) - (inProgressCount/10)
//    - Higher score = higher priority = should get more tasks
// 5. Returns: suggestions with reasons + member performance data
// 6. Manager can make informed decisions
//
// Response Example:
// ┌──────────────────────────────────────────────────────────┐
// │ 💡 **Gợi ý phân công công việc:**                        │
// │                                                          │
// │ 1. **Implement API endpoint for users**                  │
// │    → Gợi ý: Nguyễn Văn A                                 │
// │    📝 Nguyễn Văn A đã hoàn thành 85% tasks và hiện có   │
// │       2 task đang làm                                    │
// │                                                          │
// │ 2. **Fix bug in authentication**                         │
// │    → Gợi ý: Trần Thị B                                   │
// │    📝 Trần Thị B đã hoàn thành 60% tasks và hiện có 2   │
// │       task đang làm                                      │
// │                                                          │
// │ 3. **Write unit tests**                                  │
// │    → Gợi ý: Nguyễn Văn A                                 │
// │    📝 Nguyễn Văn A đã hoàn thành 85% tasks và hiện có   │
// │       2 task đang làm                                    │
// │                                                          │
// │ 4. **Design dashboard UI**                               │
// │    → Gợi ý: Trần Thị B                                   │
// │    📝 Trần Thị B đã hoàn thành 60% tasks và hiện có 2   │
// │       task đang làm                                      │
// │                                                          │
// │ 5. **Setup database**                                    │
// │    → Gợi ý: Lý Văn C                                     │
// │    📝 Lý Văn C đã hoàn thành 33% tasks và hiện có 0     │
// │       task đang làm                                      │
// │                                                          │
// │ 📊 **Hiệu suất thành viên (dùng để tham khảo khi phân    │
// │ công):**                                                 │
// │                                                          │
// │ 1. **Nguyễn Văn A**                                       │
// │    - Hoàn thành: 85% (8/10)                              │
// │    - Đang làm: 2 | Chưa làm: 0 | Quá hạn: 0            │
// │                                                          │
// │ 2. **Trần Thị B**                                        │
// │    - Hoàn thành: 60% (3/5)                               │
// │    - Đang làm: 2 | Chưa làm: 0 | Quá hạn: 1            │
// │                                                          │
// │ 3. **Lý Văn C**                                          │
// │    - Hoàn thành: 33% (2/6)                               │
// │    - Đang làm: 0 | Chưa làm: 2 | Quá hạn: 1            │
// └──────────────────────────────────────────────────────────┘

// ============================================================
// TECHNICAL IMPLEMENTATION
// ============================================================

// Files Modified:
// 1. v1/services/manager-analytics.helper.js (NEW)
//    - getManagerProjects(managerId) - Fetch projects managed by user
//    - getProjectMembers(projectId) - Get team members in project
//    - getProjectStats(projectId) - Calculate overall project statistics
//    - getMemberPerformance(projectId) - Per-member stats
//    - suggestTaskAssignment(projectId, n) - Generate suggestions
//    - getOverdueTasks(projectId) - List overdue tasks
//    - formatProjectMembers/formatProjectStats/etc - Format for chat display
//
// 2. v1/services/rag.service.js (MODIFIED)
//    - detectIntent() - Added 3 new intents: team_members, project_stats, task_assignment
//    - generateResponse() - Added MANAGER analytics handler (lines ~1000-1100)
//      * Checks intent for 'team_members', 'project_stats', 'task_assignment'
//      * Requires userId (authentication)
//      * Fetches manager's projects
//      * Routes to appropriate helper methods
//      * Returns formatted response

// Database Queries Used:
// 1. Project.find({ createdBy: managerId }) - Get managed projects
// 2. Project.find({ manager: managerId }) - Also check manager field
// 3. Project.findById(projectId).populate('members.userId') - Get members with details
// 4. Task.find({ projectId, status: { $ne: 'completed' }, deadline: { $lt: now } }) - Overdue tasks
// 5. Task.find({ projectId }).populate('assignee') - All tasks for stats
// 6. Task.find({ projectId, assignee: null }) - Unassigned tasks for suggestions

// ============================================================
// TESTING THE FEATURES
// ============================================================

// Test with cURL:
/*
curl -X POST http://localhost:3000/rag/chat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"message": "Ai trong team?"}'

curl -X POST http://localhost:3000/rag/chat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"message": "Tiến độ dự án như thế nào?"}'

curl -X POST http://localhost:3000/rag/chat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"message": "Gợi ý phân công công việc"}'
*/

// Expected Behavior:
// 1. Authentication required - token extracted from Authorization header
// 2. detectIntent() recognizes MANAGER keywords
// 3. generateResponse() routes to MANAGER handler
// 4. Helper queries database for project and task data
// 5. Data formatted and returned to user
// 6. Response includes: answer text + isManagerAnalytics flag + managerData object

// ============================================================
// CONSTRAINTS & LIMITATIONS
// ============================================================

// ✅ What Works:
// - Detects user is manager by querying Project.find with their ID
// - Returns data only for projects they manage
// - Formats data beautifully for chat display
// - Uses RAG paradigm for consistency

// ⚠️ Current Limitations:
// - Only shows first managed project (if manager has multiple projects)
// - Could be enhanced to let user specify which project
// - Task assignment suggestions are basic (could add machine learning)
// - No caching of project data (fresh query every time)

// 🔮 Future Enhancements:
// - Support "Filter by project name" in queries
// - Advanced workload balancing algorithm
// - Performance trending over time
// - Team velocity metrics
// - Predictive deadline warnings
// - Custom report generation

module.exports = {
  documentation: true
};
