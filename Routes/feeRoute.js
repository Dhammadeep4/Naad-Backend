import express from "express";
import {
  getFees,
  getFeesByClass,
  updateFees,
} from "../controllers/feesController.js";
import verifyRole from "../middlewares/auth.js";

//initialize the router
const feeRouter = express.Router();

feeRouter.post("/update", verifyRole(["admin"]), updateFees);
feeRouter.get("/getFee", verifyRole(["admin"]), getFees);
feeRouter.get("/amount/:year", getFeesByClass);

export default feeRouter;
