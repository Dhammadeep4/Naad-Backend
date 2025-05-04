import express from "express";
import {
  createUser,
  getCreds,
  login,
  resetCreds,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/create", createUser);
userRouter.post("/login", login);
userRouter.post("/getCreds", getCreds);
userRouter.post("/reset", resetCreds);

export default userRouter;
