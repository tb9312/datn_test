const mongoose = require("mongoose");
const Calendar = require("../../../models/calendar.model");
const PagitationHelper = require("../../../helpers/pagitation");
const SearchHelper = require("../../../helpers/search");
const { buildDateFilter } = require("../../../helpers/calendar");
// [POST] /api/v1/calendars/create
module.exports.create = async (req, res) => {
  console.log(req.user.id);
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        code: 401,
        message: "Unauthorized",
      });
    }

    const {
      title,
      description,
      type,
      listUser,
      timeStart,
      timeFinish,
      location,
      isAllDay,
    } = req.body;

    // Validate
    if (!title || !timeStart || !timeFinish) {
      return res.status(400).json({
        code: 400,
        message: "Thiếu dữ liệu bắt buộc",
      });
    }

    if (new Date(timeFinish) < new Date(timeStart)) {
      return res.status(400).json({
        code: 400,
        message: "timeFinish phải lớn hơn timeStart",
      });
    }

    const calendar = new Calendar({
      title,
      description,
      type,
      listUser,
      timeStart,
      timeFinish,
      location,
      isAllDay,
      createdBy: req.user.id,
    });

    const data = await calendar.save();

    return res.status(201).json({
      code: 201,
      message: "Tạo lịch thành công",
      data,
    });
  } catch (error) {
    console.error("Calendar create error:", error);

    return res.status(500).json({
      code: 500,
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/calendars/edit/:id
module.exports.edit = async (req, res) => {
  try {
    const { id } = req.params;

    //Check login
    if (!req.user?.id) {
      return res.status(401).json({
        code: 401,
        message: "Unauthorized",
      });
    }

    //Check ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        code: 400,
        message: "ID không hợp lệ",
      });
    }

    //Field được phép update
    const allowedFields = [
      "title",
      "description",
      "type",
      "listUser",
      "timeStart",
      "timeFinish",
      "location",
      "isAllDay",
    ];

    //Tạo updateData
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    //Không có gì để update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        code: 400,
        message: "Không có dữ liệu để cập nhật",
      });
    }

    //Update + check quyền
    const result = await Calendar.updateOne(
      {
        _id: id,
        createdBy: req.user.id,
        deleted: false,
      },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy calendar hoặc không có quyền",
      });
    }

    return res.status(200).json({
      code: 200,
      message: "Cập nhật calendar thành công",
    });
  } catch (error) {
    console.error("Calendar edit error:", error);

    return res.status(500).json({
      code: 500,
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/calendars
module.exports.index = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        code: 401,
        message: "Unauthorized",
      });
    }
    const { date } = req.query;

    const find = {
      $or: [{ createdBy: req.user.id }, { listUser: req.user.id }],
      deleted: false,
      ...buildDateFilter(date),
    };
    if (req.query.type) {
      find.type = req.query.type;
    }
    //Search
    let objectSearch = SearchHelper(req.query);
    if (req.query.keyword) {
      find.title = objectSearch.regex;
    }
    //end search

    //Pagination
    let initPagination = {
      currentPage: 1,
      limitItem: 2,
    };

    const countCalendars = await Calendar.countDocuments(find);
    const objectPagination = PagitationHelper(
      req.query,
      initPagination,
      countCalendars
    );
    //End Pagination
    //sort
    // console.log(req.query);
    const sort = {};
    if (req.query.sortKey && req.query.sortValue) {
      sort[req.query.sortKey] = req.query.sortValue;
    }
    //end sort
    const data = await Calendar.find(find)
      .sort(sort)
      .limit(objectPagination.limitItem)
      .skip(objectPagination.skip);
    return res.status(200).json({
      code: 200,
      message: "Lấy danh sách calendar thành công",
      data: data,
    });
  } catch (error) {
    console.error("Calendar index error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/calendars/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user?.id) {
      return res.status(401).json({
        code: 401,
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        code: 400,
        message: "ID không hợp lệ",
      });
    }

    const calendar = await Calendar.findOne({
      _id: id,
      $or: [{ createdBy: req.user.id }, { listUser: req.user.id }],
      deleted: false,
    });

    if (!calendar) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy calendar",
      });
    }

    return res.status(200).json({
      code: 200,
      message: "Lấy chi tiết calendar thành công",
      data: calendar,
    });
  } catch (error) {
    console.error("Calendar detail error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi hệ thống",
    });
  }
};

//[PATCH]/api/v1/calendars/delete/:id
module.exports.delete = async (req, res) => {
  try {
    // console.log(req.params.id);
    const id = req.params.id;
    const data = await Calendar.findOne({
      _id: id,
      deleted: false,
      createdBy: req.user.id,
    });
    if (data) {
      await Calendar.updateOne(
        {
          _id: id,
        },
        {
          deleted: true,
        }
      );
      const data = await Calendar.findOne({
        _id: id,
        deleted: false,
      });
      res.json({
        code: 200,
        message: "đã xoá cuộc họp",
        data: data,
      });
    } else {
      res.json({
        code: 400,
        message: "Ban khong duoc xoá cuộc cua nguoi khac",
      });
    }
  } catch (error) {
    res.json({
      code: 404,
      message: "dismiss",
    });
  }
};