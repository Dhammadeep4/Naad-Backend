import express from "express";
import upload from "../middlewares/multer.js";
import {
  addStudent,
  check,
  deleteStudent,
  editStudent,
  getStudents,
  getStudentswithLastHistory,
  lastPayment,
  setStatus,
  viewStudent,
  viewStudentwithHistory,
} from "../controllers/studentController.js";
import verifyRole from "../middlewares/auth.js";

const adminRouter = express.Router();
adminRouter.post(
  "/add",
  verifyRole(["admin"]),
  upload.single("image"),
  addStudent
);
adminRouter.get("/students", getStudents);
adminRouter.get(
  "/studentsLastHistory",
  verifyRole(["admin"]),
  getStudentswithLastHistory
);
adminRouter.get("/studentPayments/:id", viewStudentwithHistory);
//get last payment from student collection
adminRouter.get("/lastPayment/:id", verifyRole(["student"]), lastPayment);
adminRouter.get("/studentProfile/:id", verifyRole(["admin"]), viewStudent);

adminRouter.post("/edit/:id", upload.single("image"), editStudent);
adminRouter.put("/status/:id", setStatus);
adminRouter.delete("/delete/:id", deleteStudent);
adminRouter.get("/check", check);

export default adminRouter;
