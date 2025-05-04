import express from "express";
import {
  processPayment,
  getKey,
  paymentVerfication,
  updateDB,
  getAllHistory,
  getHistoryByStudentId,
  getReceipt,
} from "../controllers/paymentController.js";
const paymentRouter = express.Router();

paymentRouter.post("/payment/process", processPayment);
paymentRouter.get("/getKey", getKey);
paymentRouter.post("/paymentVerification", paymentVerfication);
//adding payment in db
paymentRouter.post("/updateDB", updateDB);
//getting receipt
paymentRouter.get("/getReceipt/:payment_id", getReceipt);
//getting all payments made
paymentRouter.get("/getAllHistory", getAllHistory);
//getting payment history for single student
paymentRouter.get("/getStudentHistory/:student_id", getHistoryByStudentId);
export default paymentRouter;
