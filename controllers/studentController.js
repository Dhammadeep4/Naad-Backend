import studentModel from "../models/studentModel.js";
import { v2 as cloudinary } from "cloudinary";

//check
const check = async (req, res) => {
  try {
    res.status(200);
    res.send("Welcome to checking of Server");
  } catch (error) {
    //console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

//function to add Student
const addStudent = async (req, res) => {
  try {
    // Destructuring request body
    const {
      firstname,
      middlename,
      lastname,
      address,
      contact,
      dob,
      doj,
      year,
    } = req.body;

    //checks if the image file is present and then stores it in the variable
    const image = req.file.path;

    //compressing image while uploading to cloudinary
    // Reject file over 500KB
    if (req.file.size > 500 * 1024) {
      return res.json({
        success: false,
        message: "Image must be smaller than 500KB.",
      });
    }
    if (contact.length > 10 || contact.length < 10) {
      return res.json({
        success: false,
        message: "Enter valid contact number",
      });
    }

    // Upload with compression
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "image",
      folder: "students",
      transformation: [
        { width: 300, height: 300, crop: "limit" },
        { quality: "auto:low" },
        { fetch_format: "auto" },
      ],
    });

    //console.log("Upload Success:", result);

    // Validate if required fields are provided
    if (
      !firstname ||
      !middlename ||
      !lastname ||
      !address ||
      !contact ||
      !dob ||
      !doj ||
      !year
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    // Logging the student data to be added
    // console.log(
    //   "Student data::",
    //   firstname,
    //   middlename,
    //   lastname,
    //   address,
    //   contact,
    //   dob,
    //   doj,
    //   year,
    //   result.url
    // );

    const username = `${contact}@${firstname}`;
    const password = `${firstname}@${lastname}`;
    const studentData = {
      firstname,
      middlename, // This is optional, so you can pass it directly
      lastname,
      address,
      contact,
      dob,
      doj,
      year,
      image: result.secure_url,
      role: "student",
      status: "active",
      isDelete: "false",
      username: username,
      password: password,
    };
    console.log("studentData:", studentData);
    // Creating a new student document
    const newStudent = new studentModel(studentData);
    // Saving the student data to MongoDB
    await newStudent.save();

    console.log("Student Added");

    // Responding with a success message
    res.json({
      success: true,
      message: "Student added successfully",
      studentData,
    });
  } catch (error) {
    // Log error message for debugging purposes
    //console.log("Error while adding student: ", error.message);

    // Handle errors gracefully
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    // General error response
    res.status(500).json({
      success: false,
      message: "Failed to add student",
      error: error.message,
    });
  }
};

//function to get all students without paymentHistory
const getStudents = async (req, res) => {
  try {
    // Find students where role is NOT "admin", sorted by newest first
    const students = await studentModel
      .find(
        { role: "student", isDelete: "false" },
        {
          isDelete: 0,
          username: 0,
          password: 0,
          createdAt: 0,
          updatedAt: 0,
          lastPayment: 0,
          paymentHistory: 0,
        }
      )
      .sort({ _id: -1 });

    console.log("Sorted student:" + students);
    res.json({ success: true, students });
  } catch (error) {
    //console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getStudentswithLastHistory = async (req, res) => {
  try {
    // Find students where middlename is NOT "admin", sorted by newest first
    const students = await studentModel
      .find(
        { middlename: { $ne: "admin" }, isDelete: false, status: "active" },
        {
          isDelete: 0,
          username: 0,
          password: 0,
          status: 0,
          address: 0,
          contact: 0,
          role: 0,
          dob: 0,
          doj: 0,
          createdAt: 0,
          updatedAt: 0,
          paymentHistory: 0,
        }
      )
      .populate("lastPayment", "mode createdAt")
      .sort({ _id: -1 });

    console.log("Sorted student:" + students);
    res.json({ success: true, students });
  } catch (error) {
    //console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//get student's last paymetn

const lastPayment = async (req, res) => {
  const { id } = req.params;

  try {
    let data = await studentModel
      .findById(id)
      .select("lastPayment")
      .populate("lastPayment", "createdAt");

    console.log("sending response:" + data);
    res.json({
      success: true,
      data,
    });
    // else {
    //   data = { lastPayment: { createdAt: 0 } };
    //   res.json({
    //     success: true,
    //     data,
    //   });
    // }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving student",
      error: error.message,
    });
  }
};

const viewStudentwithHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await studentModel
      .findById(id)
      .select("paymentHistory pending lastPayment")
      .lean(); // use .lean() to get a plain JS object for easier manipulation

    if (data?.paymentHistory) {
      data.paymentHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    if (!data) {
      console.log("enter if");
      return res.status(401).json({
        success: false,
        message: "Something went wrong, Kindly Login again",
      });
    }

    console.log("sending response:" + data);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving student",
      error: error.message,
    });
  }
};
const viewStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await studentModel.findById(
      { _id: id },
      {
        isDelete: 0,
        username: 0,
        password: 0,
        createdAt: 0,
        updatedAt: 0,
        paymentHistory: 0,
        lastPayment: 0,
        pending: 0,
      }
    );
    res.json({ success: true, profile });
  } catch (error) {
    //console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const editStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Destructuring request body
    const {
      firstname,
      middlename,
      lastname,
      address,
      contact,
      dob,
      doj,
      year,
    } = req.body;

    let updatedData = {};
    if (req.file) {
      // handle file
      const image = req.file.path;

      const result = await cloudinary.uploader.upload(image, {
        resource_type: "image",
      });
      updatedData = {
        firstname,
        middlename,
        lastname,
        address,
        contact,
        dob,
        doj,
        year,
        image: result.secure_url,
      };
    } else {
      updatedData = {
        firstname,
        middlename,
        lastname,
        address,
        contact,
        dob,
        doj,
        year,
      };
    }

    //console.log(updatedData);

    //console.log("Before update:", await studentModel.findById(id));
    const student = await studentModel.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      res.json({ success: false, message: "Student not found" });
    } else {
      //console.log("After update:", student);
      res.json({
        success: true,
        student,
        message: "Student Edited successfully",
      });
    }
  } catch (error) {
    //console.log(error);
    //console.log("Error while adding");
    res.json({ success: false, message: error.message });
  }
};

//controller to change status
const setStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // active or inactive

    //console.log("student id" + id);
    //console.log("status:" + status);
    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Status is required." });
    }

    const updatedStudent = await studentModel.findByIdAndUpdate(
      id,
      { status: status },
      { new: true }
    );

    if (!updatedStudent) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Status updated successfully.",
      student: updatedStudent,
    });
  } catch (error) {
    //console.error("Error updating student status:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
//controller to handle delete with specific id
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    let updatedData = { isDelete: true };
    const student = await studentModel.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });
    if (!student) {
      return res.json({ success: false, message: "Student not found" });
    }
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    //console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  addStudent,
  getStudents,
  viewStudent,
  editStudent,
  getStudentswithLastHistory,
  lastPayment,
  viewStudentwithHistory,
  setStatus,
  deleteStudent,
  check,
};
