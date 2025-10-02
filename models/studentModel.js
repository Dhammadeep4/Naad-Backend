import mongoose, { Schema } from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    middlename: { type: String, required: true },
    lastname: { type: String, required: true },
    address: { type: String, required: true },
    contact: { type: String, required: true }, // Changed from Number to String
    dob: { type: String, required: true },
    doj: { type: String, required: true },
    year: { type: String, required: true },
    image: { type: String },
    role: { type: String, enum: ["admin", "student"], default: "student" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isDelete: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    lastPayment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    feePaidUntil: { type: Date, default: null }, // 👈 track fee coverage
  },

  { timestamps: true }
);

const studentModel = mongoose.model("Student", studentSchema);

export default studentModel;
