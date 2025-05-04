import userModel from "../models/userModel.js";

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

    //fetching user creds
    const user = await userModel.findOne({ username });
    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    //comparing password
    if (password != user.password) {
      res.json({ success: false, message: "Invalid credentials" });
    } else {
      res.json({
        success: true,
        message: "Logged In Successfully",
        user: {
          username: user.username,
          student_id: user.student_id, // Include student_id in response
        },
      });
    }
  } catch (error) {
    //console.log(error);
    res.json({ success: false, message: error.message });
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
