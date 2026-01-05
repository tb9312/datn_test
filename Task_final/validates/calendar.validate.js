// validations/calendar.validate.js
module.exports.validateCalendar = (req, res, next) => {
  const { title, timeStart, timeFinish } = req.body;

  // Khi CREATE thì bắt buộc
  if (req.method === "POST") {
    if (!title || !timeStart || !timeFinish) {
      return res.status(400).json({
        code: 400,
        message: "Thiếu dữ liệu bắt buộc (title, timeStart, timeFinish)",
      });
    }
  }

  // Khi UPDATE (PATCH) thì chỉ check nếu có gửi
  if (timeStart && timeFinish) {
    if (new Date(timeFinish) < new Date(timeStart)) {
      return res.status(400).json({
        code: 400,
        message: "timeFinish phải lớn hơn timeStart",
      });
    }
  }

  next();
};