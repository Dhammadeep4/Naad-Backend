import express from "express";
import {
  getFees,
  getFeesByClass,
  updateFees,
} from "../controllers/feesController.js";

//initialize the router
const feeRouter = express.Router();

feeRouter.post("/update", updateFees);
feeRouter.get("/getFee", getFees);
feeRouter.get("/amount/:year", getFeesByClass);

export default feeRouter;
