const Diary = require("../../../models/diary.model");
//[POST]/api/v1/diarys/create
module.exports.create = async (req, res) => {
  try {
    console.log(req.user.id);
    req.body.createdBy = req.user.id;
    const diary = new Diary(req.body);
    const data = await diary.save();
    res.json({
      code: 200,
      message: "success",
      data: data,
    });
  } catch (error) {
    res.json({
      code: 404,
      message: "dismiss",
    });
  }
};

//[PATCH]/api/v1/diarys/edit/:id
module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id;
    await Diary.updateOne({ _id: id }, req.body);
    const data = await Diary.findOne({
      _id: id,
      deleted: false,
    });
    res.json({
      code: 200,
      message: "success",
      data: data,
    });
  } catch (error) {
    res.json({
      code: 404,
      message: "dismiss",
    });
  }
};

//[PATCH]/api/v1/diarys/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const data = await Project.findOne({
      _id: id,
    });
    // console.log(data);
    // console.log(req.user.id);

    await Diary.updateOne(
      { _id: id },
      {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.id,
      }
    );
    res.json({
      code: 200,
      message: "success",
      data: data,
    });
  } catch (error) {
    res.json({
      code: 404,
      message: "dismiss",
    });
  }
};

//[GET]/api/v1/projects/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const id = req.params.id;
    const diary = await Diary.findOne({
      _id: id,
      deleted: false,
    });
    res.json(diary);
  } catch (error) {
    res.json("Khong tim thay");
  }
};
