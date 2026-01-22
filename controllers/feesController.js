import feesModel from "../models/feesModel.js";

//new fees controller to update fees
const updateFeesModified = async (req, res) => {
  try {
    const incomingData = req.body;
    const feeData = {};

    // console.log("Incoming Data:", req.body);
    // Dynamically convert all incoming fields to Numbers
    Object.keys(incomingData).forEach((key) => {
      // We skip empty strings and convert valid inputs to numbers
      if (incomingData[key] !== "") {
        feeData[key] = Number(incomingData[key]);
      }
    });

    // Use findOneAndUpdate with $set to allow adding new fields
    const updatedFee = await feesModel.findOneAndUpdate(
      {}, 
      { $set: feeData }, 
      {
        upsert: true, // Create the document if it doesn't exist
        new: true,    // Return the modified document
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: "Fees updated/added successfully",
      data: updatedFee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process fee update",
      error: error.message,
    });
  }
};


//fee controller to update fees
const updateFees = async (req, res) => {
  //destructuring request body
  try {
    const {
      prarambhik,
      praveshika_pratham,
      praveshika_purna,
      praveshika_purna_batch1,
      madhyama_pratham,
      madhyama_purna,
      madhyama_purna_batch1,
      visharad_pratham,
      visharad_purna,
      chote_nartak,
      registration,
    } = req.body;

    const feeData = {
      prarambhik: Number(prarambhik),
      praveshika_pratham: Number(praveshika_pratham),
      praveshika_purna: Number(praveshika_purna),
      praveshika_purna_batch1: Number(praveshika_purna_batch1),
      madhyama_pratham: Number(madhyama_pratham),
      madhyama_purna: Number(madhyama_purna),
      madhyama_purna_batch1: Number(madhyama_purna_batch1),
      visharad_pratham: Number(visharad_pratham),
      visharad_purna: Number(visharad_purna),
      chote_nartak: Number(chote_nartak),
      registration: Number(registration),
    };

    console.log(req.body);
    // Creating a new fee document
    const updatedFee = await feesModel.findOneAndReplace({}, feeData, {
      upsert: true,
      new: true,
    });

    console.log("Fee Added");

    // Responding with a success message
    res.json({
      success: true,
      message: "Fee added successfully",
      data: updatedFee,
    });
  } catch (error) {
    //console.log(error.message);
    res.status(500).json({
      success: false,
      message: "Failed to add fee",
      error: error.message,
    });
  }
};

//gets all class fee
const getFees = async (req, res) => {
  try {
    const fees = await feesModel.find({});
    res.json({ success: true, fees });
  } catch (error) {
    //console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//gets fees for a particular class
const getFeesByClass = async (req, res) => {
  try {
    const { year } = req.params; // Extract class (year) name from URL

    const fees = await feesModel.findOne(); // Fetch the fees document
    //console.log("year", year);
    //console.log("Logging", fees);
    if (!fees) {
      return res
        .status(404)
        .json({ success: false, message: "Fees not found" });
    }

    if (!(year in fees)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid class name" });
    }
    const feeAmount = fees[year];
    //console.log(feeAmount);
    res.json({ success: true, fee: feeAmount });
  } catch (error) {
    //console.error("Error fetching fee:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//add new class record in db
const addDynamicClass = async (req, res) => {
  try {
    const { className, feeAmount } = req.body;

    if (!className || feeAmount === undefined) {
      return res.status(400).json({ success: false, message: "Class name and fee are required" });
    }

    // 
    // We use bracket notation [className] to tell JS to use the string value as the key
    const updatedFee = await feesModel.findOneAndUpdate(
      {}, 
      { $set: { [className]: Number(feeAmount) } }, 
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: `Class ${className} added successfully`,
      data: updatedFee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add new class",
      error: error.message,
    });
  }
};
//controller to get all class names
const getAllClassNames = async (req, res) => {
  try {
    const feesDoc = await feesModel.findOne({});
    if (!feesDoc) return res.json({ success: true, classes: [] });

    // Convert Mongoose document to plain object
    const feesObj = feesDoc.toObject();

    // Filter out internal MongoDB keys and the 'registration' fee
    const internalKeys = ["_id", "__v", "createdAt", "updatedAt", "registration"];
    const classes = Object.keys(feesObj).filter(key => !internalKeys.includes(key));

    res.json({ success: true, classes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export { updateFees, getFees, getFeesByClass , addDynamicClass,updateFeesModified,getAllClassNames };
