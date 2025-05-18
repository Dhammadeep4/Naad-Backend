import paymentModel from "../models/paymentModel.js";
import { instance } from "../server.js"; //in this we have passed instance of razorpay created in server.js
import crypto from "crypto";
import Razorpay from "razorpay";

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
  const { payment_id, student_id, mode, receipt, remark, amount } = req.body;

  const paymentData = {
    payment_id,
    student_id,
    mode,
    amount,
    remark,
    receipt,
    request: "completed", // Optionally update the request status
  };

  try {
    // Step 1: Check if payment_id already exists

    const existingID = await paymentModel.findOne({ payment_id }); //checks for same payment_id while online transaction

    if (existingID) {
      console.log("here");
      return res.json({
        success: false,
        message: "Already updated in DB for this payment ID",
      });
    }

    // Step 2: Check if a pending payment exists for the same student and amount
    const pendingRecord = await paymentModel.findOne({
      student_id,
      request: "pending",
      amount,
    });

    if (pendingRecord) {
      // Step 3: Update the existing pending record
      pendingRecord.payment_id = payment_id;
      pendingRecord.mode = mode;
      pendingRecord.receipt = receipt;
      pendingRecord.request = "completed"; // You can choose to mark it as completed

      await pendingRecord.save();

      return res.json({
        success: true,
        message: "Pending payment updated successfully",
        updatedPayment: pendingRecord,
      });
    }

    // Step 4: If no pending record, add a new one
    const newPayment = new paymentModel(paymentData);
    await newPayment.save();

    return res.json({
      success: true,
      message: "New payment has been added successfully",
      newPayment,
    });
  } catch (error) {
    console.error("Error in updateDB:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

//controller to add payment request in db
export const paymentRequest = async (req, res) => {
  //getting student data from request body
  const { student_id, remark, amount } = req.body;
  const request = "pending";
  const mode = "pending";
  const payment_id = remark + " req_(" + student_id + ")";
  //adding with request set to pending in db
  const paymentRequestData = {
    student_id,
    remark,
    payment_id,
    mode,
    amount,
    request,
  };

  const existingID = await paymentModel.findOne({ payment_id });
  if (existingID) {
    console.log("Same ID");
    return res.json({
      success: false,
      message: "Already same remark present in DB add a new remark",
    });
  }
  const newPayment = new paymentModel(paymentRequestData);
  // Saving the student data to MongoDB
  await newPayment.save();
  res.json({
    success: true,
    message: "Payment Request has been created",
    newPayment,
  });
};

export const paymentVerfication = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (!isAuthentic) {
    return res.redirect(
      `http://localhost:5173/paymentFailure?reference=${razorpay_payment_id}`
      // `https://naad.netlify.app/paymentFailure?reference=${razorpay_payment_id}`
    );
  }

  // ✅ Fetch full payment details from Razorpay
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_API_SECRET,
    });

    const paymentData = await razorpay.payments.fetch(razorpay_payment_id);

    // Extracting notes from Razorpay response
    const { notes } = paymentData;

    // OPTIONAL: Save to DB here using your updateDB controller or direct logic
    // await paymentModel.create({ ... });
    // `https://naad.netlify.app/paymentSuccess?reference=${razorpay_payment_id}`
    return res.redirect(
      `http://localhost:5173/paymentSuccess?reference=${razorpay_payment_id}&amount=${notes.amount}&remarks=${notes.remark}`
    );
  } catch (error) {
    console.error("Error fetching payment from Razorpay:", error);
    return res.redirect(
      `http://localhost:5173/paymentFailure?reference=${razorpay_payment_id}`
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
  console.log(payment_id);
  if (payment_id === "N/A") {
    try {
      const data = await paymentModel.find({ payment_id });
      console.log(data);
      if (!data || data.length == 0) {
        console.log("here");
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
      console.log(error.message);
    }
  } else {
    try {
      const data = await paymentModel.find({ payment_id });

      if (!data || data.length == 0) {
        console.log("here");
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
      console.log(error.message);
    }
  }
};
