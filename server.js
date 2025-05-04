import express, { application } from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import adminRouter from "./Routes/adminRoute.js";
import feeRouter from "./Routes/feeRoute.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./Routes/userRoute.js";
import paymentRouter from "./Routes/paymentRoute.js";
import Razorpay from "razorpay";
//Configuration of App
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();
//middleware
app.use(express.json({ limit: "10mb" })); //after adding this whatever request will be passed will be in json.
//app.use(express.urlencoded({ extended: false })); // helps in parsing frontend data as formdata
app.use(express.urlencoded({ limit: "10mb", extended: true })); //method inbuilt in express to recognize the incoming Request Object as strings or arrays.
app.use(cors()); //allows accessing backend from any IP

//creating an instance of razorpay
export const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

app.listen(port, () => console.log("Server Started on port:" + port));

//routes
app.use("/api/admin", adminRouter);
app.use("/api/fee", feeRouter);
app.use("/api/user", userRouter);
app.use("/api/v1", paymentRouter);

app.get("/", (req, res) => {
  res.status(200);
  res.send("Welcome to the root URL of Server");
});
