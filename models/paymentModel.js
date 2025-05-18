import mongoose, { Schema } from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    payment_id: { type: String, required: true },
    student_id: { type: Schema.Types.ObjectId, required: true },
    mode: { type: String, required: true },
    amount: { type: String },
    receipt: { type: String },
    request: { type: String },
    remark: { type: String },
  },
  { timestamps: true }
);
const paymentModel = mongoose.model("Payment", paymentSchema);
export default paymentModel;
