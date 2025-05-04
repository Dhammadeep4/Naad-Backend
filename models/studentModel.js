import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  middlename: { type: String, required: true },
  lastname: { type: String, required: true },
  address: { type: String, required: true },
  contact: { type: Number, required: true },
  dob: { type: String, required: true },
  doj: { type: String, required: true },
  year: { type: String, required: true },
  image: { type: String },
  status: { type: String },
});

const studentModel = mongoose.model("Student", studentSchema);

export default studentModel;
