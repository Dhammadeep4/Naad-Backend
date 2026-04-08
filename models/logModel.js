import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ["DELETE", "CREATE", "UPDATE", "FETCH", "ERROR"],
    },
    endpoint: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    errorMessage: {
      type: String,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Log", logSchema);
