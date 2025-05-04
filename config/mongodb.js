import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("DB Connnected✅");
  });

  await mongoose.connect(`${process.env.MONGODB_URI}/naad-nrutya`);
};

export default connectDB;
