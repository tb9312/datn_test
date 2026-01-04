const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    listUser: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],

    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
const Team = mongoose.model("Team", teamSchema, "teams");

module.exports = Team;
