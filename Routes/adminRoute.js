import express from "express";
import upload from "../middlewares/multer.js";
import {
  addStudent,
  check,
  deleteStudent,
  editStudent,
  getStudents,
  setStatus,
  viewStudent,
} from "../controllers/studentController.js";

const adminRouter = express.Router();
adminRouter.post("/add", upload.single("image"), addStudent);
adminRouter.get("/students", getStudents);
adminRouter.get("/studentProfile/:id", viewStudent);
adminRouter.post("/edit/:id", upload.single("image"), editStudent);
adminRouter.put("/status/:id", setStatus);

adminRouter.delete("/delete/:id", deleteStudent);
adminRouter.get("/check", check);
export default adminRouter;
