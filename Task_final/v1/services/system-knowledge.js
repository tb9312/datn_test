/**
 * System Knowledge Base - Thông tin về hệ thống để chatbot trả lời
 */

const systemKnowledge = {
  // Thông tin tổng quan về hệ thống
  overview: {
    name: "Hệ thống Quản lý Task và Dự án",
    description: "Hệ thống quản lý công việc, dự án và nhóm làm việc với đầy đủ tính năng ",
    features: [
      "Quản lý Task cá nhân và nhóm",
      "Quản lý Dự án",
      "Quản lý Nhóm làm việc",
      "Lịch làm việc",
      "Báo cáo và thống kê",
      "Chat nhóm",
      "Thông báo real-time"
    ]
  },

  // Hướng dẫn sử dụng các tính năng
  userGuides: {
    // Đăng ký và đăng nhập
    authentication: {
      register: {
        question: ["đăng ký", "tạo tài khoản", "register", "sign up"],
        answer: `Để đăng ký tài khoản mới, bạn làm theo các bước sau:

1. **Truy cập trang đăng ký**: Click vào nút "Đăng ký" hoặc truy cập đường dẫn /register

2. **Điền thông tin**:
   - Họ và tên đầy đủ
   - Email (sẽ dùng để đăng nhập)
   - Mật khẩu (nên có độ dài tối thiểu 6 ký tự)

3. **Xác nhận**: Click nút "Đăng ký" để hoàn tất

Sau khi đăng ký thành công, hệ thống sẽ tự động đăng nhập cho bạn.`
      },
      login: {
        question: ["đăng nhập", "login", "đăng nhập vào", "sign in"],
        answer: `Để đăng nhập vào hệ thống:

1. **Truy cập trang đăng nhập**: Click "Đăng nhập" hoặc vào /login

2. **Nhập thông tin**:
   - Email đã đăng ký
   - Mật khẩu

3. **Chọn loại tài khoản** (nếu có):
   - User: Tài khoản thông thường
   - Manager: Tài khoản quản lý (có quyền cao hơn)

4. **Click "Đăng nhập"**

Nếu quên mật khẩu, bạn có thể sử dụng tính năng "Quên mật khẩu" để khôi phục qua email.`
      },
      forgotPassword: {
        question: ["quên mật khẩu", "forgot password", "khôi phục mật khẩu", "reset password"],
        answer: `Để khôi phục mật khẩu:

1. **Truy cập trang quên mật khẩu**: Click "Quên mật khẩu?" trên trang đăng nhập

2. **Nhập email**: Nhập email đã đăng ký

3. **Nhận mã OTP**: Hệ thống sẽ gửi mã OTP qua email của bạn

4. **Xác thực OTP**: Nhập mã OTP nhận được

5. **Đặt mật khẩu mới**: Nhập mật khẩu mới và xác nhận

Sau đó bạn có thể đăng nhập bằng mật khẩu mới.`
      }
    },

    // Quản lý Task
    tasks: {
      create: {
        question: ["tạo task", "thêm task", "tạo công việc", "thêm công việc", "create task", "add task"],
        answer: `Để tạo task mới:

1. **Truy cập trang công việc**: 
   - Vào menu "Công việc" → "Cá Nhân" (cho task cá nhân)
   - Hoặc "Nhóm" (cho task nhóm)

2. **Click nút "Tạo Công Việc"** 

3. **Điền thông tin task**:
   - **Tiêu đề**: Tên task (bắt buộc)
   - **Mô tả**: Chi tiết về task
   - **Trạng thái**: Chọn từ "Tồn đọng", "Chưa bắt đầu", "Đang thực hiện", "Hoàn thành"
   - **Độ ưu tiên**: Cao, Trung bình, Thấp
   - **Thời gian bắt đầu**: Ngày bắt đầu
   - **Thời gian kết thúc**: Deadline
   - **Tags**: Thẻ phân loại (nếu có)

4. **Lưu**: Click "Tạo mới" để hoàn tất

Task sẽ xuất hiện trong danh sách và bạn có thể theo dõi tiến độ.`
      },
      edit: {
        question: ["sửa task", "chỉnh sửa task", "edit task", "update task"],
        answer: `Để chỉnh sửa task:

1. **Tìm công việc cần sửa**: Vào trang Công Việc và tìm công việc trong danh sách

2. **Mở Công Việc**: Click vào công việc hoặc click nút "Chỉnh sửa"

3. **Chỉnh sửa thông tin**: Thay đổi các thông tin cần thiết

4. **Lưu thay đổi**: Click "Lưu" hoặc "Cập nhật"

Bạn có thể thay đổi tiêu đề, mô tả, trạng thái, độ ưu tiên, thời gian, v.v.`
      },
      changeStatus: {
        question: ["thay đổi trạng thái", "đánh dấu hoàn thành", "change status", "complete task"],
        answer: `Để thay đổi trạng thái task:

**Cách 1 - Từ danh sách**:
1. Tìm task trong danh sách
2. Click vào dropdown trạng thái
3. Chọn trạng thái mới: "Pending", "In Progress", hoặc "Completed"

**Cách 2 - Từ Task Board (Kanban)**:
1. Vào trang Tasks
2. Kéo thả task từ cột này sang cột khác
3. Trạng thái sẽ tự động cập nhật

**Cách 3 - Từ chi tiết task**:
1. Mở task cần thay đổi
2. Chọn trạng thái mới trong form
3. Lưu thay đổi

Các trạng thái có sẵn:
- **Pending**: Chưa bắt đầu
- **In Progress**: Đang thực hiện
- **Completed**: Đã hoàn thành`
      },
      view: {
        question: ["xem task", "danh sách task", "list tasks", "xem công việc"],
        answer: `Để xem danh sách task:

1. **Vào menu "Tasks"** trên sidebar

2. **Chọn loại task**:
   - **Personal Tasks**: Task cá nhân của bạn
   - **Team Tasks**: Task của nhóm

3. **Xem dạng danh sách**: Hiển thị dạng bảng với các thông tin cơ bản

4. **Xem dạng Kanban**: Click chuyển sang chế độ Kanban để xem theo trạng thái

5. **Lọc và tìm kiếm**:
   - Dùng thanh tìm kiếm để tìm theo tên
   - Lọc theo trạng thái
   - Sắp xếp theo ngày, độ ưu tiên

6. **Xem chi tiết**: Click vào task để xem đầy đủ thông tin`
      }
    },

    // Quản lý Project
    projects: {
      create: {
        question: ["tạo project", "tạo dự án", "create project", "thêm dự án"],
        answer: `Để tạo project mới:

1. **Vào trang Projects**: Click "Projects" trên menu

2. **Click "Tạo Project"** hoặc nút "Thêm mới"

3. **Điền thông tin**:
   - **Tên dự án**: Tên project (bắt buộc)
   - **Mô tả**: Mô tả về dự án
   - **Trạng thái**: Active, Inactive, Completed
   - **Thời gian**: Ngày bắt đầu và kết thúc dự kiến
   - **Thành viên**: Thêm các thành viên vào project (nếu có quyền)

4. **Lưu**: Click "Tạo" để hoàn tất

Sau khi tạo, bạn có thể thêm tasks vào project này.`
      },
      view: {
        question: ["xem project", "danh sách project", "list projects", "xem dự án"],
        answer: `Để xem danh sách projects:

1. **Vào menu "Projects"** trên sidebar

2. **Xem danh sách**: Hiển thị tất cả projects bạn tham gia

3. **Xem chi tiết**: Click vào project để xem:
   - Thông tin chi tiết
   - Danh sách tasks trong project
   - Thành viên tham gia
   - Tiến độ dự án

4. **Lọc và tìm kiếm**: Dùng thanh tìm kiếm và bộ lọc để tìm project`
      }
    },

    // Quản lý Team
    teams: {
      create: {
        question: ["tạo team", "tạo nhóm", "create team", "thêm nhóm"],
        answer: `Để tạo team mới:

1. **Vào trang Teams**: Click "Teams" trên menu

2. **Click "Tạo Team"**

3. **Điền thông tin**:
   - **Tên nhóm**: Tên team
   - **Mô tả**: Mô tả về nhóm
   - **Thành viên**: Mời các thành viên vào nhóm

4. **Lưu**: Click "Tạo" để hoàn tất

Sau khi tạo, bạn có thể tạo tasks và projects cho team này.`
      },
      chat: {
        question: ["chat nhóm", "team chat", "trò chuyện nhóm"],
        answer: `Để sử dụng chat nhóm:

1. **Vào trang Teams**: Click "Teams" trên menu

2. **Chọn team**: Click vào team bạn muốn chat

3. **Vào tab Chat**: Trong trang chi tiết team, chọn tab "Chat"

4. **Gửi tin nhắn**: 
   - Nhập tin nhắn vào ô chat
   - Click "Gửi" hoặc nhấn Enter
   - Tin nhắn sẽ hiển thị real-time cho tất cả thành viên

5. **Xem lịch sử**: Cuộn lên để xem các tin nhắn cũ

Chat nhóm hỗ trợ real-time, mọi thành viên sẽ thấy tin nhắn ngay lập tức.`
      }
    },

    // Calendar
    calendar: {
      view: {
        question: ["xem lịch", "calendar", "lịch làm việc"],
        answer: `Để xem lịch làm việc:

1. **Vào menu "Calendar"** trên sidebar

2. **Xem lịch**:
   - **Tháng**: Xem toàn bộ tháng
   - **Tuần**: Xem theo tuần
   - **Ngày**: Xem chi tiết một ngày

3. **Xem events**: Các task và sự kiện sẽ hiển thị trên lịch

4. **Tạo event**: Click vào ngày để tạo event mới

5. **Xem chi tiết**: Click vào event để xem thông tin chi tiết

Lịch sẽ tự động đồng bộ với tasks và projects của bạn.`
      },
      createEvent: {
        question: ["tạo event", "thêm sự kiện", "create event"],
        answer: `Để tạo event trên lịch:

1. **Vào trang Calendar**

2. **Chọn ngày**: Click vào ngày bạn muốn tạo event

3. **Điền thông tin**:
   - **Tiêu đề**: Tên sự kiện
   - **Thời gian**: Giờ bắt đầu và kết thúc
   - **Mô tả**: Chi tiết về sự kiện
   - **Màu sắc**: Chọn màu để phân biệt

4. **Lưu**: Click "Tạo" để hoàn tất

Event sẽ hiển thị trên lịch và bạn có thể chỉnh sửa sau.`
      }
    },

    // Dashboard
    dashboard: {
      view: {
        question: ["dashboard", "trang chủ", "tổng quan", "xem dashboard"],
        answer: `Dashboard là trang tổng quan của hệ thống:

**Thông tin hiển thị**:
- **Thống kê tổng quan**: Tổng số tasks, tasks đang chờ, tasks nhóm
- **Biểu đồ tiến độ**: Xem tiến độ hoàn thành tasks
- **Hoạt động gần đây**: Các hoạt động mới nhất
- **Tasks sắp đến hạn**: Các tasks cần chú ý

**Cách sử dụng**:
1. Đăng nhập vào hệ thống, bạn sẽ tự động vào Dashboard
2. Xem các thống kê và biểu đồ
3. Click vào các card để xem chi tiết
4. Theo dõi hoạt động gần đây

Dashboard sẽ khác nhau tùy theo vai trò của bạn (User hoặc Manager).`
      }
    },

    // Reports
    reports: {
      personal: {
        question: ["báo cáo cá nhân", "personal reports", "thống kê cá nhân"],
        answer: `Để xem báo cáo cá nhân:

1. **Vào menu "Reports"** → "Personal Reports"

2. **Xem các báo cáo**:
   - **Thống kê tasks**: Số lượng tasks theo trạng thái
   - **Biểu đồ năng suất**: Xem hiệu suất làm việc theo thời gian
   - **Tasks hoàn thành**: Tỷ lệ hoàn thành tasks
   - **Thời gian làm việc**: Thống kê thời gian dành cho các tasks

3. **Lọc theo thời gian**: Chọn khoảng thời gian muốn xem (tuần, tháng, quý)

4. **Xuất báo cáo**: Có thể xuất báo cáo ra file (nếu có tính năng)

Báo cáo cá nhân giúp bạn theo dõi hiệu suất làm việc của mình.`
      },
      system: {
        question: ["báo cáo hệ thống", "system reports", "thống kê hệ thống"],
        answer: `Báo cáo hệ thống chỉ dành cho Manager:

1. **Yêu cầu quyền**: Bạn phải có quyền Manager để truy cập

2. **Vào menu "Reports"** → "System Reports"

3. **Xem các báo cáo**:
   - **Thống kê toàn hệ thống**: Tổng số users, tasks, projects
   - **Hiệu suất nhóm**: Thống kê theo từng team
   - **Biểu đồ tổng quan**: Xem xu hướng và phân tích
   - **Báo cáo chi tiết**: Phân tích sâu về từng khía cạnh

4. **Lọc và xuất**: Lọc theo thời gian, nhóm, và xuất báo cáo

Báo cáo hệ thống giúp Manager có cái nhìn tổng quan về toàn bộ hoạt động.`
      }
    },

    // Notifications
    notifications: {
      view: {
        question: ["thông báo", "notifications", "xem thông báo"],
        answer: `Để xem thông báo:

1. **Click vào biểu tượng chuông** 🔔 ở header

2. **Xem danh sách thông báo**:
   - Thông báo mới sẽ có dấu chấm đỏ
   - Xem tất cả thông báo trong dropdown

3. **Các loại thông báo**:
   - Task được giao cho bạn
   - Task được cập nhật
   - Comment mới
   - Thông báo từ team
   - Thông báo hệ thống

4. **Đánh dấu đã đọc**: Click vào thông báo để đánh dấu đã đọc

5. **Xem tất cả**: Click "Xem tất cả" để vào trang thông báo đầy đủ

Thông báo sẽ hiển thị real-time khi có sự kiện mới.`
      }
    },

    // Profile
    profile: {
      view: {
        question: ["hồ sơ", "profile", "thông tin cá nhân", "tài khoản"],
        answer: `Để xem và chỉnh sửa hồ sơ:

1. **Vào menu "Profile"** hoặc click vào avatar ở header

2. **Xem thông tin**:
   - Họ và tên
   - Email
   - Vai trò (User/Manager)
   - Thông tin khác

3. **Chỉnh sửa**: Click "Chỉnh sửa" để thay đổi thông tin

4. **Đổi mật khẩu**: Có thể đổi mật khẩu trong phần cài đặt

5. **Lưu thay đổi**: Click "Lưu" sau khi chỉnh sửa

Hồ sơ của bạn sẽ hiển thị cho các thành viên khác trong team.`
      }
    }
  },

  // Câu hỏi thường gặp
  faq: {
    general: [
      {
        question: ["hệ thống này làm gì", "tính năng", "features", "chức năng"],
        answer: `Hệ thống này là một nền tảng quản lý công việc và dự án toàn diện với các tính năng:

✅ **Quản lý Task**: Tạo, theo dõi và quản lý công việc cá nhân và nhóm
✅ **Quản lý Project**: Tổ chức và quản lý các dự án
✅ **Quản lý Team**: Làm việc nhóm, chat và collaboration
✅ **Lịch làm việc**: Xem và quản lý lịch trình
✅ **Báo cáo**: Thống kê và phân tích hiệu suất
✅ **Thông báo**: Nhận thông báo real-time về các hoạt động
✅ **Admin Panel**: Quản lý hệ thống (dành cho Manager)

Hệ thống hỗ trợ nhiều vai trò khác nhau và có giao diện thân thiện, dễ sử dụng.`
      },
      {
        question: ["bắt đầu", "bắt đầu như thế nào", "getting started", "hướng dẫn"],
        answer: `Để bắt đầu sử dụng hệ thống:

1. **Đăng ký tài khoản**: Nếu chưa có, hãy đăng ký tài khoản mới
2. **Đăng nhập**: Sử dụng email và mật khẩu để đăng nhập
3. **Khám phá Dashboard**: Xem tổng quan về công việc của bạn
4. **Tạo task đầu tiên**: Thử tạo một task để làm quen
5. **Tham gia team**: Tìm hoặc tạo team để làm việc nhóm
6. **Xem lịch**: Kiểm tra lịch làm việc của bạn

Bạn có thể hỏi tôi bất cứ điều gì về cách sử dụng hệ thống!`
      }
    ]
  }
};

/**
 * Tìm câu trả lời từ knowledge base
 */
function findAnswerFromKnowledge(query) {
  const lowerQuery = query.toLowerCase().trim();

  // Tìm trong user guides
  for (const [category, guides] of Object.entries(systemKnowledge.userGuides)) {
    for (const [key, guide] of Object.entries(guides)) {
      if (guide.question) {
        const matches = guide.question.some(q => 
          lowerQuery.includes(q.toLowerCase())
        );
        if (matches) {
          return guide.answer;
        }
      }
    }
  }

  // Tìm trong FAQ
  for (const category of Object.values(systemKnowledge.faq)) {
    if (Array.isArray(category)) {
      for (const item of category) {
        if (item.question) {
          const matches = item.question.some(q => 
            lowerQuery.includes(q.toLowerCase())
          );
          if (matches) {
            return item.answer;
          }
        }
      }
    }
  }

  return null;
}

module.exports = {
  systemKnowledge,
  findAnswerFromKnowledge
};





