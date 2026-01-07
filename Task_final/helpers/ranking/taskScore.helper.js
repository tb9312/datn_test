const PRIORITY_SCORE = {
  high: 30,
  medium: 20,
  low: 10,
};

const STATUS_PENALTY = {
  backlog: -5,
  todo: 0,
  "in-progress": 10,
  done: -1000, // gần như loại khỏi danh sách
};

function getDeadlineScore(timeFinish) {
  if (!timeFinish) return 0;

  const now = Date.now();
  const diffHours = (new Date(timeFinish) - now) / (1000 * 60 * 60);

  if (diffHours <= 0) return 40; // quá hạn
  if (diffHours <= 24) return 35; // trong ngày
  if (diffHours <= 72) return 25; // 3 ngày
  if (diffHours <= 168) return 15; // 1 tuần
  return 5;
}

function getEstimatedScore(hours) {
  if (!hours) return 0;

  if (hours <= 1) return 15; // việc ngắn → làm nhanh
  if (hours <= 3) return 10;
  if (hours <= 6) return 5;
  return 0;
}

function calculateTaskScore(task) {
  let score = 0;

  // Priority
  score += PRIORITY_SCORE[task.priority] || 0;

  // Deadline
  score += getDeadlineScore(task.timeFinish);

  // Estimated hours
  score += getEstimatedScore(task.estimatedHours);

  // Status
  score += STATUS_PENALTY[task.status] || 0;

  // Overdue bonus
  if (task.timeFinish && new Date(task.timeFinish) < new Date()) {
    score += 20;
  }

  return score;
}

module.exports = {
  calculateTaskScore,
};