import express from "express";
import {
  processPayment,
  getKey,
  paymentVerfication,
  updateDB,
  getAllHistory,
  getHistoryByStudentId,
  paymentRequest,
  getPending,
  getMonthHistory,
  getMonthlyPaymentStats,
  getPendingHistoryByStudentId,
  getCompletedHistoryByStudentId,
  getMonthlyPaymentStatsRevised,
  getPredictedCollection,
} from "../controllers/paymentController.js";

import verifyRole from "../middlewares/auth.js";
const paymentRouter = express.Router();

paymentRouter.post("/payment/process", processPayment);
paymentRouter.get("/getKey", getKey);
paymentRouter.post("/paymentVerification", paymentVerfication);
//adding payment in db
paymentRouter.post("/updateDB", verifyRole(["admin", "student"]), updateDB);

//getting all payments made
paymentRouter.get("/getAllHistory", getAllHistory);
//getting month history
paymentRouter.get(
  "/getMonthHistory/:month/:year",
  verifyRole(["admin"]),
  getMonthHistory
);

//get pending history
paymentRouter.get("/getPending", verifyRole(["admin"]), getPending);
//getting payment history for single student
paymentRouter.get("/getStudentHistory/:student_id", getHistoryByStudentId);
//getting pending history for single student
paymentRouter.get(
  "/getPendingStudentHistory/:id",
  verifyRole(["student"]),
  getPendingHistoryByStudentId
);
//getting completed history for single student
paymentRouter.get(
  "/getCompletedStudentHistory/:id",
  verifyRole(["admin", "student"]),
  getCompletedHistoryByStudentId
);
//controller to get monthly stats
paymentRouter.get(
  "/getAnalytics",
  verifyRole(["admin"]),
  getMonthlyPaymentStats
);

//get monthly stats revised logic
paymentRouter.get(
  "/getAnalyticsRevised",
  verifyRole(["admin"]),
  getMonthlyPaymentStatsRevised
);

//get predicted collection
paymentRouter.get("/getPredictedCollection", getPredictedCollection);

//creating a payment request
paymentRouter.post("/paymentrequest", verifyRole(["admin"]), paymentRequest);
export default paymentRouter;
