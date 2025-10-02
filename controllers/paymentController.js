import paymentModel from "../models/paymentModel.js";
import studentModel from "../models/studentModel.js";
import feeModel from "../models/feesModel.js";
import ExcelJS from "exceljs";
import { instance } from "../server.js"; //in this we have passed instance of razorpay created in server.js
import crypto from "crypto";
import Razorpay from "razorpay";
//import { ObjectId } from "mongodb";

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
  const {
    payment_id,
    student_id,
    mode,
    receipt,
    remark,
    amount,
    feePaidUntil,
  } = req.body;
  console.log("Body", req.body);
  const paymentData = {
    payment_id,
    student_id,
    mode,
    amount,
    remark,
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
      remark,
    });

    if (pendingRecord) {
      console.log("Entering pending");
      // Step 3: Update the existing pending record
      pendingRecord.payment_id = payment_id;
      pendingRecord.mode = mode;
      pendingRecord.receipt = receipt;
      pendingRecord.request = "completed"; // You can choose to mark it as completed

      await pendingRecord.save();
      //remove pending request from aray in student collection

      //const pendingId = new ObjectId(pendingRecord._id);
      //console.log("ObjectId:", pendingId);
      // const data = {
      //   $push: {
      //     paymentHistory: {
      //       $each: [
      //         {
      //           mode,
      //           payment_id,
      //           remark,
      //           amount,
      //           date: pendingRecord.updatedAt,
      //         },
      //       ],
      //       $slice: -10, // Keep only the latest 10 entries
      //     },
      //   },
      //   $pull: {
      //     pending: {
      //       amount: amount,
      //       remark: pendingRecord.remark,
      //     },
      //   },
      // };
      // try {
      //   const student = await studentModel.findByIdAndUpdate(student_id, data, {
      //     new: true,
      //     runValidators: true,
      //   });
      //   if (!student) {
      //     return res.json({ success: false, message: "Student not found" });
      //   }
      // } catch (error) {
      //   console.log("Error::" + error);
      //   res.json({ success: false, message: "Error updating payment" });
      // }
      return res.json({
        success: true,
        message: "Pending payment updated successfully",
        updatedPayment: pendingRecord,
      });
    }

    // Step 4: If no pending record, add a new one
    const newPayment = new paymentModel(paymentData);
    await newPayment.save();
    await lastPayment(newPayment, feePaidUntil);

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

//function to update last payment and in student collection
const lastPayment = async (paymentData, feePaidUntil) => {
  const { student_id, mode, payment_id, amount, remark, createdAt } =
    paymentData;
  console.log(paymentData);
  console.log("FeePaidUntil:", feePaidUntil);
  const updatedData = {
    $set: {
      lastPayment: paymentData._id,
    },
  };

  if (feePaidUntil) {
    updatedData.$set.feePaidUntil = feePaidUntil;
  }

  try {
    const student = await studentModel.findByIdAndUpdate(
      student_id,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!student) {
      return res.json({ success: false, message: "Student not found" });
    }
  } catch (error) {
    console.log("Error::" + error);
    res.json({ success: false, message: "Error updating payment" });
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

  const existing = await paymentModel.findOne({ payment_id, amount });
  if (existing) {
    console.log("Same ID");
    return res.json({
      success: false,
      message:
        "Clear previous request with same amount and then add new request with same amount",
    });
  }
  const newPayment = new paymentModel(paymentRequestData);
  // Saving the student data to MongoDB
  await newPayment.save();

  console.log("Logging new payment", newPayment);
  const date = newPayment.createdAt;
  const pendingData = {
    $push: {
      pending: {
        $each: [{ date, payment_id, remark, amount }], // Keep only the latest 10 entries
      },
    },
  };
  try {
    const student = await studentModel.findByIdAndUpdate(
      student_id,
      pendingData,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!student) {
      return res.json({ success: false, message: "Student not found" });
    }
  } catch (error) {
    console.log("Error::" + error);
    res.json({ success: false, message: "Error updating payment request" });
  }

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
      // `http://localhost:5173/paymentFailure?reference=${razorpay_payment_id}`
      `https://naad.netlify.app/paymentFailure?reference=${razorpay_payment_id}`
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
      `http://localhost:5174/paymentSuccess?reference=${razorpay_payment_id}&amount=${notes.amount}&remarks=${notes.remark}`
    );
  } catch (error) {
    console.error("Error fetching payment from Razorpay:", error);
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
export const getMonthHistory = async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month) - 1;

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    // Fetch payments for the month and populate student info
    const payments = await paymentModel
      .find({
        updatedAt: { $gte: startDate, $lt: endDate },
      })
      .populate("student_id", "firstname lastname year"); // only populate needed fields
    console.log("logging:", payments.student_id);
    // Create Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Payments");

    // Define headers
    worksheet.columns = [
      { header: "First Name", key: "firstName", width: 20 },
      { header: "Last Name", key: "lastName", width: 20 },
      { header: "Year", key: "year", width: 10 },
      { header: "Amount", key: "amount", width: 10 },
      { header: "Payment_id", key: "payment_id", width: 10 },
      { header: "Remark", key: "remark", width: 20 },
      { header: "Request", key: "request", width: 15 },
      { header: "Updated At", key: "updatedAt", width: 25 },
    ];

    // Add data rows
    payments.forEach((payment) => {
      const student = payment.student_id || {};
      worksheet.addRow({
        firstName: student.firstname || "",
        lastName: student.lastname || "",
        year: student.year || "",
        remark: payment.remark,
        amount: payment.amount,
        payment_id: payment.payment_id,
        request: payment.request,
        updatedAt: payment.updatedAt.toLocaleDateString(),
      });
      console.log(
        `Payment Student: ${student.firstname} fees: ${payment.amount}`
      );
    });

    // Set headers and send Excel file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payments_${year}_${month + 1}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//controller to get monthly stats

export const getMonthlyPaymentStats = async (req, res) => {
  try {
    const payments = await paymentModel.aggregate([
      {
        $match: { request: "completed" },
      },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" },
          },
          totalAmount: {
            $sum: { $toDouble: "$amount" },
          },
          students: { $addToSet: "$student_id" },
        },
      },
      {
        $sort: {
          "_id.year": -1,
          "_id.month": -1,
        },
      },
      {
        $limit: 6,
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $cond: [
                  { $lt: ["$_id.month", 10] },
                  { $concat: ["0", { $toString: "$_id.month" }] },
                  { $toString: "$_id.month" },
                ],
              },
            ],
          },
          totalAmount: 1,
          uniqueStudents: { $size: "$students" },
        },
      },
      {
        $sort: { month: 1 }, // optional: sort months in ascending order for chart
      },
    ]);

    const result = {};
    payments.forEach((entry) => {
      result[entry.month] = {
        amount: entry.totalAmount,
        uniqueStudents: entry.uniqueStudents,
      };
    });

    // const dummy = {
    //   "2025-01": { amount: 25000, uniqueStudents: 26 },
    //   "2025-02": { amount: 27000, uniqueStudents: 28 },
    //   "2025-03": { amount: 45000, uniqueStudents: 32 },
    //   "2025-04": { amount: 35000, uniqueStudents: 30 },
    //   "2025-05": { amount: 32000, uniqueStudents: 34 },
    //   "2025-06": { amount: 30000, uniqueStudents: 34 },
    // };
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//revised logic for monthly stats
export const getMonthlyPaymentStatsRevised = async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5); // include current + last 5 months

    const result = await paymentModel.aggregate([
      {
        //include payment documents where updatedAt is between six months ago and now.
        $match: {
          updatedAt: { $gte: sixMonthsAgo, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" },
          },
          totalCollection: { $sum: { $toDouble: "$amount" } },
          uniqueStudents: { $addToSet: "$student_id" },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          totalCollection: 1,
          studentCount: { $size: "$uniqueStudents" },
        },
      },
      { $sort: { year: 1, month: 1 } }, // chronological order
    ]);
    console.log("resultJson:", result);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

//controller to get predicted collection for next month
export const getPredictedCollection = async (req, res) => {
  try {
    // 1. Count active students by year
    const activeStudents = await studentModel.aggregate([
      { $match: { status: "active", isDelete: "false" } },
      {
        $group: {
          _id: "$year",
          count: { $sum: 1 },
        },
      },
    ]);

    // 2. Get fee structure (assuming only one fees document exists)
    const fees = await feeModel.findOne({});
    if (!fees) {
      return res.status(404).json({ error: "Fees structure not found" });
    }
    // console.log("Fees:", fees);

    // 3. Calculate predicted collection
    let predictedCollection = 0;
    let breakdown = [];

    activeStudents.forEach((item) => {
      let year = item._id;
      const count = item.count;
      console.log("Year:", year);
      year = year.toLowerCase();
      let y = year.replace(/ /g, "_");
      // console.log("Modified Year:", y);
      const feeAmount = fees[y] || 0; // match field in feesSchema
      let total = count * feeAmount;
      console.log(`Total for${y} : ${total}`);
      predictedCollection += total;
      breakdown.push({
        year,
        count,
        feeAmount,
        total,
      });
    });

    //4. Calculate this month's collection
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    //gives you the last possible moment of the current month.
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const monthCollection = await paymentModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $toDouble: "$amount" } },
          uniqueStudents: { $addToSet: "$student_id" },
        },
      },
      {
        $project: {
          _id: 0,
          totalAmount: 1,
          studentCount: { $size: "$uniqueStudents" },
        },
      },
    ]);
    const stats =
      monthCollection.length > 0
        ? monthCollection[0]
        : { totalAmount: 0, studentCount: 0 };
    console.log("This Month Stats:", stats);

    console.log("Predicted Collection:", predictedCollection);
    console.log("Breakdown:", breakdown);
    console.log("Active Students:", activeStudents);
    res.json({
      success: true,
      totalActiveStudents: activeStudents.reduce((sum, s) => sum + s.count, 0),
      predictedCollection,
      breakdown,
      stats, // detailed info
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
//controller to fetch all pending history
export const getPending = async (req, res) => {
  try {
    const history = await paymentModel
      .find({ request: "pending" })
      .select("student_id amount remark createdAt")
      .populate("student_id", "firstname lastname year");
    console.log("populate", history);

    res.json({ success: true, history });
  } catch (error) {
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

export const getPendingHistoryByStudentId = async (req, res) => {
  const { id } = req.params;

  try {
    const history = await paymentModel
      .find({ student_id: id, request: "pending" })
      .select("amount remark");

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

export const getCompletedHistoryByStudentId = async (req, res) => {
  const { id } = req.params;
  console.log("Id", id);

  try {
    const history = await paymentModel
      .find({
        student_id: id,
        request: "completed",
      })
      .select("payment_id mode amount remark updatedAt")
      .sort({ _id: -1 });

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
    console.error("Error fetching history:", error.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
