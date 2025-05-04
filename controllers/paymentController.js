import paymentModel from "../models/paymentModel.js";
import { instance } from "../server.js"; //in this we have passed instance of razorpay created in server.js
import crypto from "crypto";
export const processPayment = async (req, res) => {
  //this controller accepts payment amount in request body
  const options = {
    amount: Number(req.body.amount * 100), //converting into cents
    currency: "INR",
  };

  //below we are creating the order
  const order = await instance.orders.create(options);
  res.status(200).json({
    success: true,
    order, //sending order which you have created
  });
};

export const getKey = async (req, res) => {
  res.status(200).json({
    key: process.env.RAZORPAY_API_KEY,
  });
};

//below controller is to update payment in db
export const updateDB = async (req, res) => {
  //console.log("Logging request body", req.body);
  const { payment_id, student_id, mode, receipt, amount } = req.body;

  const paymentData = {
    payment_id,
    student_id,
    mode,
    amount,
    receipt,
  };
  // Check if payment_id already exists
  const existingID = await paymentModel.findOne({ payment_id });
  if (existingID) {
    return res.status(400).json({
      success: false,
      message: "Already updated in DB for payment Id",
    });
  }

  const newPayment = new paymentModel(paymentData);
  // Saving the student data to MongoDB
  await newPayment.save();

  //console.log("Payment has been Added", newPayment);

  // Responding with a success message
  res.json({ success: true, message: "Payment has been updated", newPayment });
};

export const paymentVerfication = async (req, res) => {
  //destructuring the request body where we get successfull payment details
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  //creating crypted signature which we will match with obtained razorpay signature to verify payment
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    return res.redirect(
      `https://naad.netlify.app/paymentSuccess?reference=${razorpay_payment_id}`
    );
  } else {
    return res.redirect(
      `https://naad.netlify.app/paymentFailure?reference=${razorpay_payment_id}`
    );
  }
};

//controller to fetch all history of payments
export const getAllHistory = async (req, res) => {
  try {
    const history = await paymentModel.find({});
    res.json({ success: true, history });
  } catch (error) {
    //console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getHistoryByStudentId = async (req, res) => {
  const { student_id } = req.params;

  try {
    const history = await paymentModel.find({ student_id });

    if (!history || history.length == 0) {
      return res.status(404).json({
        success: false,
        message: "No history found for this student ID",
      });
    }

    res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    //console.error("Error fetching history:", error.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
export const getReceipt = async (req, res) => {
  const { payment_id } = req.params;
  //console.log(payment_id);
  try {
    const data = await paymentModel.find({ payment_id });

    if (!data || data.length == 0) {
      return res.status(404).json({
        success: false,
        message: "No history found for this student ID",
      });
    }

    res.status(200).json({
      success: true,
      receipt: data[0].receipt,
    });
  } catch (error) {
    //console.log(error.message);
  }
};
