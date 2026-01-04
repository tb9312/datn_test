import { http, HttpResponse } from 'msw';

// Mock data - có thể import từ file riêng nếu muốn
const mockTasks = [
  {
    id: 1,
    title: 'Thiết kế giao diện người dùng',
    content: 'Thiết kế wireframe và prototype cho ứng dụng',
    status: 'in-progress',
    priority: 'high',
    timeStart: '2024-01-15',
    timeFinish: '2024-01-25',
    tags: ['design', 'ui/ux'],
    assignee: null,
    createdAt: '2024-01-10T08:00:00Z'
  },
  {
    id: 2,
    title: 'Phát triển API authentication',
    content: 'Xây dựng hệ thống xác thực JWT',
    status: 'todo',
    priority: 'high',
    timeStart: '2024-01-20',
    timeFinish: '2024-02-01',
    tags: ['backend', 'security'],
    assignee: { id: 1, name: 'Nguyễn Văn A', avatar: null },
    createdAt: '2024-01-12T10:30:00Z'
  },
  {
    id: 3,
    title: 'Viết tài liệu hệ thống',
    content: 'Hoàn thiện tài liệu hướng dẫn sử dụng',
    status: 'done',
    priority: 'medium',
    timeStart: '2024-01-05',
    timeFinish: '2024-01-15',
    tags: ['documentation'],
    assignee: null,
    createdAt: '2024-01-04T14:20:00Z'
  }
];

const mockUsers = [
  { id: 1, name: 'Nguyễn Văn A', email: 'a@company.com', avatar: null },
  { id: 2, name: 'Trần Thị B', email: 'b@company.com', avatar: null },
  { id: 3, name: 'Lê Văn C', email: 'c@company.com', avatar: null }
];

export const handlers = [
  // GET /api/v1/tasks - Lấy danh sách tasks
  http.get('http://localhost:3370/api/v1/tasks', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status');
    
    let filteredTasks = [...mockTasks];
    
    // Filter theo search
    if (search) {
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.content.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filter theo status
    if (status && status !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    
    return HttpResponse.json({
      data: filteredTasks,
      total: filteredTasks.length,
      success: true
    });
  }),

  // GET /api/v1/tasks/detail/:id - Lấy chi tiết task
  http.get('http://localhost:3370/api/v1/tasks/detail/:id', ({ params }) => {
    const task = mockTasks.find(t => t.id === parseInt(params.id));
    
    if (!task) {
      return HttpResponse.json(
        { error: 'Task not found', success: false },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      data: task,
      success: true
    });
  }),

  // POST /api/v1/tasks/create - Tạo task mới
  http.post('http://localhost:3370/api/v1/tasks/create', async ({ request }) => {
    const newTask = await request.json();
    
    const createdTask = {
      id: Date.now(), // Generate unique ID
      ...newTask,
      createdAt: new Date().toISOString()
    };
    
    // Trong thực tế, bạn sẽ thêm vào mockTasks
    // mockTasks.push(createdTask);
    
    return HttpResponse.json({
      data: createdTask,
      success: true,
      message: 'Tạo công việc thành công'
    }, { status: 201 });
  }),

  // PATCH /api/v1/tasks/edit/:id - Cập nhật task
  http.patch('http://localhost:3370/api/v1/tasks/edit/:id', async ({ request, params }) => {
    const updatedData = await request.json();
    const taskId = parseInt(params.id);
    
    const existingTask = mockTasks.find(t => t.id === taskId);
    if (!existingTask) {
      return HttpResponse.json(
        { error: 'Task not found', success: false },
        { status: 404 }
      );
    }
    
    const updatedTask = {
      ...existingTask,
      ...updatedData
    };
    
    return HttpResponse.json({
      data: updatedTask,
      success: true,
      message: 'Cập nhật công việc thành công'
    });
  }),

  // PATCH /api/v1/tasks/change-status/:id - Thay đổi trạng thái
  http.patch('http://localhost:3370/api/v1/tasks/change-status/:id', async ({ request, params }) => {
    const { status } = await request.json();
    const taskId = parseInt(params.id);
    
    const existingTask = mockTasks.find(t => t.id === taskId);
    if (!existingTask) {
      return HttpResponse.json(
        { error: 'Task not found', success: false },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      data: { id: taskId, status },
      success: true,
      message: 'Thay đổi trạng thái thành công'
    });
  }),

  // PATCH /api/v1/tasks/delete/:id - Xóa task
  http.patch('http://localhost:3370/api/v1/tasks/delete/:id', ({ params }) => {
    const taskId = parseInt(params.id);
    
    const existingTask = mockTasks.find(t => t.id === taskId);
    if (!existingTask) {
      return HttpResponse.json(
        { error: 'Task not found', success: false },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Xóa công việc thành công'
    });
  }),

  // GET /api/v1/users - Lấy danh sách users (cho assignee)
  http.get('http://localhost:3370/api/v1/users', () => {
    return HttpResponse.json({
      data: mockUsers,
      total: mockUsers.length,
      success: true
    });
  })
];