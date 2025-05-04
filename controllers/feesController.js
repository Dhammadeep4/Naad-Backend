import feesModel from "../models/feesModel.js";

const updateFees = async (req, res) => {
  //destructuring request body
  try {
    const {
      prarambhik,
      praveshika_pratham,
      praveshika_purna,
      madhyama_pratham,
      madhyama_purna,
      visharad_pratham,
      visharad_purna,
      chote_nartak,
      registration,
    } = req.body;

    const feeData = {
      prarambhik: Number(prarambhik),
      praveshika_pratham: Number(praveshika_pratham),
      praveshika_purna: Number(praveshika_purna),
      madhyama_pratham: Number(madhyama_pratham),
      madhyama_purna: Number(madhyama_purna),
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
    console.log(error.message);
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
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//gets fees for a particular class
const getFeesByClass = async (req, res) => {
  try {
    const { year } = req.params; // Extract class (year) name from URL

    const fees = await feesModel.findOne(); // Fetch the fees document
    console.log("year", year);
    console.log("Logging", fees);
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
    console.log(feeAmount);
    res.json({ success: true, fee: feeAmount });
  } catch (error) {
    console.error("Error fetching fee:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export { updateFees, getFees, getFeesByClass };
