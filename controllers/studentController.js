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

    const result = await cloudinary.uploader.upload(image, {
      resource_type: "image",
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
      status: "active",
    };

    // Creating a new student document
    const newStudent = new studentModel(studentData);
    // Saving the student data to MongoDB
    await newStudent.save();

    //console.log("Student Added");

    // Responding with a success message
    res.json({ success: true, message: "Student added successfully" });
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

//function to get all students
const getStudents = async (req, res) => {
  try {
    const students = await studentModel.find({});
    res.json({ success: true, students });
  } catch (error) {
    //console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const viewStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await studentModel.findById(id);
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
    const student = await studentModel.findByIdAndDelete(id);
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
  setStatus,
  deleteStudent,
  check,
};
