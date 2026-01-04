const mongoose = require("mongoose");
const diarySchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    // position: Number,
    createdBy: String,
    deletedAt: Date,
  },
  { timestamps: true }
);

const Diary = mongoose.model("Diary", diarySchema, "diarys");

module.exports = Diary;
