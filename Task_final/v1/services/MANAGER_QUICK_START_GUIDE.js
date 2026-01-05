/**
 * MANAGER CHATBOT FEATURES - QUICK START GUIDE
 * 
 * Testing the 3 new MANAGER analytics features
 */

// ============================================================
// TEST 1: List Team Members
// ============================================================
// 
// Query Patterns That Trigger This:
// - "Ai trong team?"
// - "Danh sách thành viên"
// - "Co ai trong dự án?"
// - "Team members"
// - "Dũng thi tham gia?"
// - "Ai lam cung toi?"
//
// What Happens:
// 1. User sends message → Chat endpoint
// 2. Auth middleware validates token → Sets req.user
// 3. RAG service detects intent = 'team_members'
// 4. Calls: managerAnalyticsHelper.getManagerProjects(userId)
// 5. Calls: managerAnalyticsHelper.getProjectMembers(projectId)
// 6. Formats with: managerAnalyticsHelper.formatProjectMembers()
// 7. Returns: "📋 **Danh sách thành viên (X người):**\n..."
//
// Example cURL:
/*
curl -X POST http://localhost:3000/rag/chat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Ai trong team?"
  }'

Response:
{
  "answer": "📋 **Danh sách thành viên (3 người):**\n\n1. **Nguyễn Văn A** (@nguyenvana)\n   - Email: a@example.com\n   - Vai trò: Developer\n\n...",
  "isManagerAnalytics": true,
  "managerIntent": "team_members",
  "managerData": {
    "projectName": "Website Redesign",
    "members": [
      {
        "userId": { "_id": "...", "fullName": "Nguyễn Văn A", "email": "a@example.com" },
        "role": "Developer"
      },
      ...
    ]
  }
}
*/

// ============================================================
// TEST 2: Project Statistics & Performance
// ============================================================
//
// Query Patterns That Trigger This:
// - "Tiến độ dự án?"
// - "Ai chậm deadline?"
// - "Task quá hạn bao nhiêu?"
// - "Tỷ lệ hoàn thành bao nhiêu?"
// - "Thống kê dự án"
// - "Progress report"
// - "Overdue tasks"
// - "Team performance"
//
// What Happens:
// 1. User sends message → Chat endpoint
// 2. Auth middleware validates token → Sets req.user
// 3. RAG service detects intent = 'project_stats'
// 4. Calls: managerAnalyticsHelper.getProjectStats(projectId)
// 5. Calls: managerAnalyticsHelper.getMemberPerformance(projectId)
// 6. Calls: managerAnalyticsHelper.getOverdueTasks(projectId)
// 7. Formats all data
// 8. Returns: Combined response with stats + performance + overdue
//
// Example cURL:
/*
curl -X POST http://localhost:3000/rag/chat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tiến độ dự án?"
  }'

Response:
{
  "answer": "📊 **Thống kê Website Redesign:**\n\n• **Tổng task**: 20\n• **Đã hoàn thành**: 14 (70%)\n• **Đang làm**: 4\n• **Chưa làm**: 2\n• **Quá hạn**: 2 (10%)\n\n⚠️ Cần tăng tốc độ\n\n👥 **Hiệu suất thành viên:**\n...",
  "isManagerAnalytics": true,
  "managerIntent": "project_stats",
  "managerData": {
    "projectName": "Website Redesign",
    "stats": {
      "total": 20,
      "completed": 14,
      "pending": 2,
      "inProgress": 4,
      "overdue": 2,
      "completionRate": 70,
      "overdueRate": 10
    },
    "memberPerformance": [
      {
        "userId": "...",
        "name": "Nguyễn Văn A",
        "total": 10,
        "completed": 8,
        "completionRate": 80,
        "pending": 1,
        "inProgress": 1,
        "overdue": 0
      },
      ...
    ],
    "overdueTasks": [
      {
        "_id": "...",
        "title": "Implement login",
        "assignee": { "fullName": "Lý Văn C", ... },
        "deadline": "2024-12-15",
        "status": "in_progress"
      },
      ...
    ]
  }
}
*/

// ============================================================
// TEST 3: Task Assignment Suggestions
// ============================================================
//
// Query Patterns That Trigger This:
// - "Ai nên làm task này?"
// - "Phân công công việc"
// - "Gợi ý phân công"
// - "Gán task cho ai?"
// - "Ai có thời gian không?"
// - "Task assignment suggestions"
// - "Ai can ho tro?"
//
// What Happens:
// 1. User sends message → Chat endpoint
// 2. Auth middleware validates token → Sets req.user
// 3. RAG service detects intent = 'task_assignment'
// 4. Calls: managerAnalyticsHelper.suggestTaskAssignment(projectId, 5)
// 5. Calls: managerAnalyticsHelper.getMemberPerformance(projectId)
// 6. Formats suggestions with reasons
// 7. Returns: "💡 **Gợi ý phân công công việc:**\n..."
//
// Suggestion Algorithm:
// - Gets unassigned/pending tasks (max 10)
// - Scores each team member: (completionRate/100) - (inProgress/10)
// - Higher score = should get next task
// - Provides reason: "Nguyễn Văn A đã hoàn thành 85% tasks..."
//
// Example cURL:
/*
curl -X POST http://localhost:3000/rag/chat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Gợi ý phân công công việc"
  }'

Response:
{
  "answer": "💡 **Gợi ý phân công công việc:**\n\n1. **Implement API endpoint for users**\n   → Gợi ý: Nguyễn Văn A\n   📝 Nguyễn Văn A đã hoàn thành 85% tasks và hiện có 2 task đang làm\n\n...",
  "isManagerAnalytics": true,
  "managerIntent": "task_assignment",
  "managerData": {
    "projectName": "Website Redesign",
    "suggestions": [
      {
        "taskId": "...",
        "taskTitle": "Implement API endpoint for users",
        "suggestedAssignee": "Nguyễn Văn A",
        "assigneeId": "...",
        "reason": "Nguyễn Văn A đã hoàn thành 85% tasks và hiện có 2 task đang làm"
      },
      {
        "taskId": "...",
        "taskTitle": "Fix bug in authentication",
        "suggestedAssignee": "Trần Thị B",
        "assigneeId": "...",
        "reason": "Trần Thị B đã hoàn thành 60% tasks và hiện có 2 task đang làm"
      },
      ...
    ],
    "memberPerformance": [
      {
        "userId": "...",
        "name": "Nguyễn Văn A",
        "total": 10,
        "completed": 8,
        "completionRate": 85,
        "pending": 1,
        "inProgress": 2,
        "overdue": 0
      },
      ...
    ]
  }
}
*/

// ============================================================
// DEBUGGING & ERROR HANDLING
// ============================================================

/**
 * If features don't work, check:
 * 
 * 1. Authentication
 *    - Token must be valid and present in Authorization header
 *    - Token should be Bearer format: "Bearer YOUR_TOKEN"
 *    - Test with: /rag/me endpoint to verify auth
 *
 * 2. User has projects to manage
 *    - Check if user's ID appears in Project.manager or Project.createdBy
 *    - If no projects: system returns "Bạn hiện chưa quản lý dự án nào"
 *
 * 3. Project has tasks
 *    - Stats feature needs tasks in database
 *    - If no tasks: returns empty stats with "Dự án không có task nào"
 *
 * 4. Check server logs
 *    - Look for [RAG] MANAGER log messages
 *    - Error logs will show database query issues
 *    - Check MongoDB connection
 *
 * 5. Verify intent detection
 *    - Query might not match keyword patterns
 *    - Add more keywords if needed (edit detectIntent() in rag.service.js)
 */

// ============================================================
// KEYWORDS REFERENCE
// ============================================================

/**
 * TEAM_MEMBERS Intent:
 * Keywords that trigger this:
 * - "ai trong team"
 * - "thanh vien"
 * - "co ai"
 * - "team members"
 * - "dung thi tham gia"
 * - "team nay co"
 * - "danh sach thanh vien"
 * - "ai lam cung"
 *
 * Example queries:
 * - "Team của dự án gồm ai?"
 * - "Tôi muốn xem danh sách thành viên"
 * - "Ai đang làm việc trong dự án này?"
 * - "Liệt kê tất cả team members"
 * - "Dũng có làm việc với mình không?"
 */

/**
 * PROJECT_STATS Intent:
 * Keywords that trigger this:
 * - "tien do"
 * - "ai cham"
 * - "task cham"
 * - "hoan thanh"
 * - "ti le hoan thanh"
 * - "quá hạn"
 * - "slow"
 * - "progress"
 * - "delay"
 * - "overdue"
 *
 * Example queries:
 * - "Tiến độ của dự án bây giờ thế nào?"
 * - "Ai đang chậm deadline?"
 * - "Có bao nhiêu task quá hạn?"
 * - "Tỷ lệ hoàn thành là bao nhiêu?"
 * - "Show me the progress report"
 * - "Những task nào chậm nhất?"
 */

/**
 * TASK_ASSIGNMENT Intent:
 * Keywords that trigger this:
 * - "ai lam"
 * - "phan cong"
 * - "gan task"
 * - "ai co khong"
 * - "can gan"
 * - "assign"
 * - "suggestion"
 * - "goi y phan cong"
 *
 * Example queries:
 * - "Ai nên làm task này?"
 * - "Hãy gợi ý phân công công việc"
 * - "Gán task cho ai là tốt?"
 * - "Ai có thời gian làm thêm?"
 * - "Suggest task assignment"
 * - "Phân công lại công việc đi"
 */

// ============================================================
// IMPLEMENTATION CHECKLIST
// ============================================================

/**
 * ✅ Files Created:
 * [x] v1/services/manager-analytics.helper.js
 * [x] v1/services/MANAGER_FEATURES.md
 * [x] v1/services/MANAGER_IMPLEMENTATION_SUMMARY.md
 * [x] v1/services/MANAGER_QUICK_START_GUIDE.js (this file)
 *
 * ✅ Files Modified:
 * [x] v1/services/rag.service.js (detectIntent + generateResponse)
 *
 * ✅ Features Implemented:
 * [x] Team Members Listing (getProjectMembers + formatProjectMembers)
 * [x] Project Statistics (getProjectStats + getOverdueTasks + formatters)
 * [x] Member Performance (getMemberPerformance + formatter)
 * [x] Task Assignment Suggestions (suggestTaskAssignment + formatter)
 *
 * ✅ Tested:
 * [x] No syntax errors in new files
 * [x] Model imports correct
 * [x] All methods implemented
 * [x] All formatters implemented
 * [x] Error handling in place
 *
 * ✅ Documentation:
 * [x] Feature examples and flow diagrams
 * [x] Response format examples
 * [x] Testing instructions with cURL
 * [x] Keyword reference for debugging
 * [x] Implementation summary
 * [x] Quick start guide (this file)
 */

// ============================================================
// NEXT STEPS FOR USER
// ============================================================

/**
 * 1. Copy valid token from your login session
 *    - Use the token returned from /auth/login endpoint
 *    - Or get from browser localStorage['token']
 *
 * 2. Test with one of the provided cURL examples
 *    - Replace YOUR_TOKEN with actual token
 *    - Change localhost:3000 if using different host/port
 *
 * 3. Check the response
 *    - Should have isManagerAnalytics: true
 *    - Should have managerIntent and managerData
 *    - Answer field should have formatted text
 *
 * 4. If issues:
 *    - Check server logs for [RAG] MANAGER messages
 *    - Verify auth token is valid (/rag/me endpoint)
 *    - Verify user has projects to manage
 *
 * 5. Integration with frontend
 *    - Frontend should check isManagerAnalytics flag
 *    - Display managerData if available (for advanced features)
 *    - Show answer text to user (as with other intents)
 */

module.exports = {
  documentation: 'MANAGER Chatbot Features Quick Start Guide',
  version: '1.0',
  status: 'READY_FOR_TESTING'
};
