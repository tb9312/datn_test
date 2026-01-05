/**
 * MANAGER CHATBOT FEATURES - VISUAL ARCHITECTURE
 * ===============================================
 * 
 * This file shows the flow diagrams and architecture
 * of the MANAGER analytics features in the RAG chatbot
 */

// ============================================================
// OVERALL SYSTEM ARCHITECTURE
// ============================================================

/**
 * Frontend (React)
 *     ↓
 * [POST] /rag/chat with message + token
 *     ↓
 * RAG Controller
 * ├─ Extract token from header
 * ├─ Validate authentication
 * └─ Get userId from req.user
 *     ↓
 * RAG Service (generateResponse)
 * ├─ Check if HOW-TO query (hướng dẫn)
 * │  ├─ Yes → Return Knowledge Guide
 * │  └─ No → Continue
 * ├─ detectIntent(query)
 * │  ├─ personal_task?
 * │  ├─ user_guide?
 * │  ├─ calendar?
 * │  ├─ team_members? ← 🔴 NEW MANAGER INTENT
 * │  ├─ project_stats? ← 🔴 NEW MANAGER INTENT
 * │  ├─ task_assignment? ← 🔴 NEW MANAGER INTENT
 * │  ├─ reports?
 * │  └─ general?
 * └─ Route by intent
 *     ├─ MANAGER intents
 *     │  └─ Call manager-analytics.helper
 *     │     ├─ Get projects, members, stats
 *     │     ├─ Query database
 *     │     └─ Format response
 *     │         ↓
 *     │     Return {answer, isManagerAnalytics, managerData}
 *     │
 *     ├─ Other intents (personal_task, calendar, etc.)
 *     │  └─ Use existing handlers
 *     │
 *     └─ Fallback
 *        └─ Return generic help message
 *     ↓
 * Send Response to Frontend
 *     ↓
 * Frontend Display Answer
 * (Optional: Use managerData for rich UI)
 */

// ============================================================
// MANAGER ANALYTICS INTENT DETECTION FLOW
// ============================================================

/**
 * User Input: "Ai trong team?"
 *     ↓
 * RAG Service.generateResponse()
 *     ↓
 * Check isHowToQuery?
 * ├─ Yes: Return knowledge guide
 * └─ No: detectIntent()
 *     ↓
 * Normalize Query: "ai trong team"
 *     ↓
 * Check Intent Patterns (in order):
 * ├─ Does it match "ai trong team" OR "thanh vien" OR "danh sach"? ← YES!
 * │  └─ return 'team_members' ✓
 * └─ No other pattern matches
 *     ↓
 * Intent = 'team_members'
 *     ↓
 * Route in generateResponse()
 *     ↓
 * if (intent === 'team_members' && userId) {
 *   → Call manager-analytics handler
 * }
 */

/**
 * User Input: "Tiến độ dự án?"
 *     ↓
 * Normalize Query: "tien do du an"
 *     ↓
 * Check Intent Patterns:
 * ├─ Does it match "tien do" OR "ai cham"? ← YES!
 * │  └─ return 'project_stats' ✓
 * └─ No other pattern matches (comes before reports intent)
 *     ↓
 * Intent = 'project_stats'
 */

/**
 * User Input: "Phân công công việc"
 *     ↓
 * Normalize Query: "phan cong cong viec"
 *     ↓
 * Check Intent Patterns:
 * ├─ Does it match "ai lam" OR "phan cong" OR "gan task"? ← YES!
 * │  └─ return 'task_assignment' ✓
 * └─ No other pattern matches
 *     ↓
 * Intent = 'task_assignment'
 */

// ============================================================
// FEATURE 1: TEAM MEMBERS - DETAILED FLOW
// ============================================================

/**
 * 📋 TEAM MEMBERS FLOW
 * 
 * User Query: "Ai trong team?"
 *     ↓
 * Intent Detected: 'team_members'
 *     ↓
 * RAG Handler:
 * ├─ require('./manager-analytics.helper')
 * ├─ getManagerProjects(userId)
 * │  └─ Query: Project.find({createdBy: userId OR manager: userId})
 * │     Database Response: [{ _id, name, members: [{ userId }, ...] }]
 * ├─ Check if projects.length > 0?
 * │  ├─ No: return "Bạn chưa quản lý dự án nào"
 * │  └─ Yes: Continue
 * ├─ Get first project: focusProject = managerProjects[0]
 * ├─ getProjectMembers(focusProject._id)
 * │  └─ Query: Project.findById(projectId)
 * │                .populate({path: 'members.userId', select: '_id fullName email'})
 * │     Database Response: {members: [{userId: {_id, fullName, email}}, ...]}
 * ├─ format = formatProjectMembers(members)
 * │  └─ Build response:
 * │     "📋 **Danh sách thành viên (X người):**\n
 * │      1. **Name** (@username)\n
 * │         - Email: email\n
 * │         - Vai trò: role\n"
 * └─ Return response
 *     ↓
 * Response Object:
 * {
 *   answer: "📋 **Danh sách thành viên...",
 *   isManagerAnalytics: true,
 *   managerIntent: 'team_members',
 *   managerData: {
 *     projectName: "Project Name",
 *     members: [...]
 *   }
 * }
 *     ↓
 * Send to Frontend
 *     ↓
 * Display answer text to user
 */

// ============================================================
// FEATURE 2: PROJECT STATS - DETAILED FLOW
// ============================================================

/**
 * 📊 PROJECT STATS FLOW
 * 
 * User Query: "Tiến độ dự án?"
 *     ↓
 * Intent Detected: 'project_stats'
 *     ↓
 * RAG Handler:
 * ├─ getManagerProjects(userId)
 * ├─ Check if projects.length > 0
 * ├─ focusProject = projects[0]
 * ├─ getProjectStats(focusProject._id)
 * │  ├─ Query: Task.find({projectId, deleted: false})
 * │  └─ Analyze statuses:
 * │     total = 20
 * │     completed = 14
 * │     pending = 2
 * │     inProgress = 4
 * │     overdue = 2
 * │     completionRate = 70%
 * ├─ getMemberPerformance(focusProject._id)
 * │  ├─ Query: Task.find({projectId, deleted: false})
 * │  │           .populate('assignee')
 * │  └─ Group by assignee, count statuses:
 * │     [{
 * │       userId: "...",
 * │       name: "Nguyễn Văn A",
 * │       total: 10,
 * │       completed: 8,
 * │       completionRate: 80%,
 * │       ...
 * │     }, ...]
 * ├─ getOverdueTasks(focusProject._id)
 * │  ├─ Query: Task.find({
 * │  │   projectId,
 * │  │   status: {$ne: 'completed'},
 * │  │   deadline: {$lt: now},
 * │  │   deleted: false
 * │  │ }).populate('assignee')
 * │  └─ Return: [{title, assignee, deadline, daysLate}, ...]
 * ├─ Format all data:
 * │  ├─ stats_text = formatProjectStats(stats)
 * │  ├─ perf_text = formatMemberPerformance(performance)
 * │  └─ overdue_text = formatOverdueTasks(overdue)
 * │     Combined: stats_text + perf_text + overdue_text
 * └─ Return response
 *     ↓
 * Response Object:
 * {
 *   answer: "📊 **Thống kê...\n👥 **Hiệu suất...\n🔴 **Tasks quá hạn...",
 *   isManagerAnalytics: true,
 *   managerIntent: 'project_stats',
 *   managerData: {
 *     projectName: "...",
 *     stats: {total, completed, pending, ...},
 *     memberPerformance: [...],
 *     overdueTasks: [...]
 *   }
 * }
 *     ↓
 * Send to Frontend
 */

// ============================================================
// FEATURE 3: TASK ASSIGNMENT - DETAILED FLOW
// ============================================================

/**
 * 💡 TASK ASSIGNMENT FLOW
 * 
 * User Query: "Gợi ý phân công"
 *     ↓
 * Intent Detected: 'task_assignment'
 *     ↓
 * RAG Handler:
 * ├─ getManagerProjects(userId)
 * ├─ focusProject = projects[0]
 * ├─ suggestTaskAssignment(focusProject._id, 5)
 * │  ├─ Query: Task.find({
 * │  │   projectId,
 * │  │   $or: [{assignee: null}, {status: 'pending'}],
 * │  │   deleted: false
 * │  │ }).sort({priority: -1, deadline: 1}).limit(10)
 * │  │ 
 * │  │ Result: [task1, task2, task3, ...]
 * │  │
 * │  ├─ getMemberPerformance(projectId)
 * │  │  Result: [
 * │  │    {name: "A", completionRate: 85%, inProgress: 2},
 * │  │    {name: "B", completionRate: 60%, inProgress: 2},
 * │  │    {name: "C", completionRate: 33%, inProgress: 0}
 * │  │  ]
 * │  │
 * │  ├─ Score members: (rate/100) - (inProgress/10)
 * │  │  A: 0.85 - 0.2 = 0.65 (highest)
 * │  │  B: 0.60 - 0.2 = 0.40
 * │  │  C: 0.33 - 0.0 = 0.33
 * │  │
 * │  ├─ Assign tasks round-robin by score:
 * │  │  task1 → A (score 0.65)
 * │  │  task2 → B (score 0.40)
 * │  │  task3 → A (score 0.65, cycle back to top)
 * │  │  task4 → B
 * │  │  task5 → C
 * │  │
 * │  └─ Return: [
 * │    {
 * │      taskId: "...",
 * │      taskTitle: "Implement API",
 * │      suggestedAssignee: "Nguyễn Văn A",
 * │      reason: "Nguyễn Văn A đã hoàn thành 85% tasks..."
 * │    },
 * │    ...
 * │  ]
 * │
 * ├─ getMemberPerformance(projectId)
 * │  └─ For reference data (show why suggestions made)
 * │
 * ├─ Format:
 * │  ├─ suggestions_text = formatAssignmentSuggestions(suggestions)
 * │  └─ perf_text = formatMemberPerformance(performance)
 * │     Combined: suggestions_text + perf_text
 * └─ Return response
 *     ↓
 * Response Object:
 * {
 *   answer: "💡 **Gợi ý phân công...\n📊 **Hiệu suất thành viên...",
 *   isManagerAnalytics: true,
 *   managerIntent: 'task_assignment',
 *   managerData: {
 *     projectName: "...",
 *     suggestions: [...],
 *     memberPerformance: [...]
 *   }
 * }
 *     ↓
 * Send to Frontend
 */

// ============================================================
// DATABASE QUERY DEPENDENCY DIAGRAM
// ============================================================

/**
 * MANAGER FEATURE DATABASE INTERACTIONS
 * 
 * User ID (from req.user)
 *     ↓
 * [Project Collection]
 * ├─ Query: {createdBy: userId OR manager: userId}
 * ├─ Return: [{_id, name, members: [{userId, role}]}]
 * └─ Purpose: Find projects managed by user
 *     ↓
 * Project ID (from first result)
 *     ↓
 * [Project Collection] + [User Collection] (populate)
 * ├─ Query: Project.findById(projectId).populate('members.userId')
 * ├─ Return: {members: [{userId: {_id, fullName, email, username}}, ...]}
 * └─ Purpose: Get member details (names, emails)
 *     ↓
 * [Task Collection]
 * ├─ Query 1: {projectId, deleted: false}
 * │  └─ Purpose: Count tasks by status (for stats)
 * ├─ Query 2: {projectId, deleted: false} + populate('assignee')
 * │  └─ Purpose: Group by assignee for member performance
 * ├─ Query 3: {projectId, status: {$ne: 'completed'}, deadline: {$lt: now}}
 * │  └─ Purpose: Find overdue tasks
 * └─ Query 4: {projectId, assignee: null OR status: pending}
 *    └─ Purpose: Find unassigned tasks for suggestions
 *     ↓
 * Format & Return to Frontend
 */

// ============================================================
// ERROR HANDLING FLOW
// ============================================================

/**
 * ERROR SCENARIO 1: User Not Authenticated
 * 
 * Missing Authorization header
 *     ↓
 * Auth Middleware
 *     ↓
 * Return 401 Unauthorized
 *     ↓
 * Never reaches RAG service
 */

/**
 * ERROR SCENARIO 2: User Has No Managed Projects
 * 
 * RAG Handler
 *     ↓
 * getManagerProjects(userId)
 *     ↓
 * Database Query returns []
 *     ↓
 * Check: if (managerProjects.length === 0)
 *     ↓
 * Return early: {answer: "Bạn hiện chưa quản lý dự án nào"}
 *     ↓
 * Never calls database for stats/members/tasks
 */

/**
 * ERROR SCENARIO 3: Project Has No Tasks
 * 
 * getProjectStats(projectId)
 *     ↓
 * Query Task.find({projectId}) returns []
 *     ↓
 * Return: {total: 0, completed: 0, ...}
 *     ↓
 * Formatter detects empty
 *     ↓
 * Return: "Dự án không có task nào"
 *     ↓
 * User sees appropriate message
 */

/**
 * ERROR SCENARIO 4: Database Connection Error
 * 
 * Any database query fails
 *     ↓
 * catch (error) block
 *     ↓
 * console.error('[Manager Analytics]', error.message)
 *     ↓
 * Return safe response: {answer: "⚠️ Có lỗi..."}
 *     ↓
 * User sees error message instead of crash
 */

// ============================================================
// INTEGRATION WITH EXISTING RAG PIPELINE
// ============================================================

/**
 * Full Chat Flow with MANAGER Feature Integrated
 * 
 * [Frontend] POST /rag/chat {message, ...}
 *     ↓
 * [Controller] Validate auth, extract userId
 *     ↓
 * [RAG Service] generateResponse(userQuery, userId)
 *     ↓
 * [Step 1] Check HOW-TO Query?
 * ├─ if (includes 'huong dan' OR 'cach')
 * │  └─ Return knowledge guide → [Response]
 * └─ else continue
 *     ↓
 * [Step 2] detectIntent(userQuery)
 * ├─ Check personal_task? → [Personal Data Handler]
 * ├─ Check user_guide? → [Knowledge Handler]
 * ├─ Check calendar? → [Calendar Handler]
 * ├─ Check team_members? → [MANAGER Handler] ← 🔴 NEW
 * ├─ Check project_stats? → [MANAGER Handler] ← 🔴 NEW
 * ├─ Check task_assignment? → [MANAGER Handler] ← 🔴 NEW
 * ├─ Check reports? → [Reports Handler]
 * └─ else → [Fallback Handler]
 *     ↓
 * [Step 3] Route to appropriate handler
 *     ↓
 * [Handler] Process intent & call database
 *     ↓
 * [Formatter] Format data for display
 *     ↓
 * [Response] {answer, isManagerAnalytics?, managerData?}
 *     ↓
 * [Controller] Send to frontend
 *     ↓
 * [Frontend] Display answer
 */

// ============================================================
// RESPONSE STRUCTURE COMPARISON
// ============================================================

/**
 * PERSONAL_TASK Response:
 * {
 *   answer: "...",
 *   sources: [],
 *   context: [],
 *   isTaskSuggestion: true,
 *   queryType: "daily_plan|priority|...",
 *   suggestionData: {...}
 * }
 * 
 * MANAGER Response (NEW):
 * {
 *   answer: "...",
 *   sources: [],
 *   context: [],
 *   isManagerAnalytics: true,      ← NEW FLAG
 *   managerIntent: "team_members", ← NEW FIELD
 *   managerData: {                 ← NEW FIELD
 *     projectName: "...",
 *     members/stats/suggestions: [...]
 *   }
 * }
 * 
 * KNOWLEDGE Response:
 * {
 *   answer: "...",
 *   sources: [],
 *   context: [],
 *   isUserGuide: true
 * }
 * 
 * Pattern: Each intent has unique flag (is*) for frontend routing
 *          Optional data field for rich UI features
 */

// ============================================================
// KEYWORD PRIORITY MATRIX
// ============================================================

/**
 * Priority Order in detectIntent():
 * 
 * LEVEL 1: HOW-TO (checked in generateResponse before detectIntent)
 * └─ Contains "hướng dẫn" OR "cách"
 * 
 * LEVEL 2: PERSONAL_TASK
 * └─ Patterns: "tao task", "tao cong viec", "them task"
 * 
 * LEVEL 3: USER_GUIDE
 * └─ Patterns: "lam sao", "huong dan", "tinh nang"
 * 
 * LEVEL 4: CALENDAR
 * └─ Patterns: "lich", "calendar", "su kien"
 * 
 * LEVEL 5: 🔴 MANAGER ANALYTICS (NEW)
 * ├─ team_members: "ai trong team", "thanh vien"
 * ├─ project_stats: "tien do", "ai cham", "hoan thanh"
 * └─ task_assignment: "ai lam", "phan cong", "gan task"
 * 
 * LEVEL 6: REPORTS
 * └─ Patterns: "bao cao", "thong ke", "dashboard"
 * 
 * LEVEL 7: GENERAL
 * └─ Patterns: "he thong", "tinh nang", "features"
 * 
 * FALLBACK: Unknown
 * └─ Return generic help message
 * 
 * Note: Lower level number = higher priority (checked first)
 *       MANAGER intents at LEVEL 5 ensures specific features
 *       are detected before generic "reports" intent
 */

module.exports = {
  documentation: 'MANAGER Features - Visual Architecture',
  diagrams: 8,
  flowcharts: 6,
  intents: 3,
  features: 3,
  ready: true
};
