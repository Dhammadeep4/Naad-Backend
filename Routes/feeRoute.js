import express from "express";
import {
  getFees,
  getFeesByClass,
  updateFees,
  addDynamicClass,
  updateFeesModified,getAllClassNames
} from "../controllers/feesController.js";
import verifyRole from "../middlewares/auth.js";

//initialize the router
const feeRouter = express.Router();

feeRouter.post("/update", verifyRole(["admin"]), updateFeesModified);
//feeRouter.post("/update", updateFeesModified);
feeRouter.get("/getFee", verifyRole(["admin"]), getFees);

// feeRouter.get("/getFee", getFees);
feeRouter.get("/amount/:year", getFeesByClass);
// feeRouter.post("/addClass",verifyRole(["admin"]),addDynamicClass);
feeRouter.get("/getAllClassNames", getAllClassNames);
export default feeRouter;
