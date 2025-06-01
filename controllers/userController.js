import userModel from "../models/userModel.js";
import studentModel from "../models/studentModel.js";
import jwt from "jsonwebtoken";
const createUser = async (req, res) => {
  //console.log("Logging request body", req.body);
  const { username, password, student_id } = req.body;
  //console.log("here");
  const userData = {
    username,
    password,
    student_id,
  };

  // Check if user already exists
  const existingUser = await userModel.findOne({ username });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User with this Student ID already exists",
    });
  }

  const newUser = new userModel(userData);
  // Saving the student data to MongoDB
  await newUser.save();

  //console.log("User Creds have been created", newUser);

  // Responding with a success message
  res.json({ success: true, message: "Creds have been generated", newUser });
};

//to authenticate user
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("Finding studetnt");
    // Find the student with matching username and password
    const user = await studentModel.findOne({ username });
    if (!user) {
      console.log("enter if");
      return res.status(401).json({
        success: false,
        message: "User Does Not Exist",
      });
    }
    if (user.password != password) {
      return res.status(401).json({
        success: false,
        message: "Incorrect credentials",
      });
    }
    console.log("Found user:", user.role);
    console.log("secret", process.env.JWT_SECRET);

    const token = jwt.sign(
      { id: user._id, role: user.role }, // You can include more info if needed
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log("token generated:", token);
    const {
      firstname,
      middlename,
      lastname,
      address,
      image,
      contact,
      dob,
      doj,
      year,
      status,
      role,
      _id,
    } = user;

    console.log("sending response:" + user);
    res.json({
      success: true,
      token,
      user: {
        firstname,
        middlename,
        lastname,
        address,
        image,
        contact,
        dob,
        doj,
        year,
        status,
        role,
        _id,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving student",
      error: error.message,
    });
  }
};

const getCreds = async (req, res) => {
  const { student_id } = req.body;

  const user = await userModel.findOne({ student_id });
  if (!user) {
    return res.json({ success: false, message: "User does not exist" });
  } else {
    return res.json({ success: true, message: "User creds exist", user });
  }
};

const resetCreds = async (req, res) => {
  try {
    const { username, password, student_id } = req.body;

    if (!student_id) {
      return res
        .status(400)
        .json({ success: false, message: "Student ID is required." });
    }

    // First, find and delete the existing credentials
    await userModel.findOneAndDelete({ student_id: student_id });

    // Now create the new credentials
    const newUser = new userModel({
      username,
      password,
      student_id,
    });

    await newUser.save();

    return res
      .status(200)
      .json({ success: true, message: "Credentials reset successfully!" });
  } catch (error) {
    //console.error("Error resetting credentials:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};
export { createUser, login, getCreds, resetCreds };
