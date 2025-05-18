import mongoose from "mongoose";

const feesSchema = new mongoose.Schema({
  prarambhik: { type: Number, required: true },
  praveshika_pratham: { type: Number, required: true },
  praveshika_purna: { type: Number, required: true },
  praveshika_purna_batch1: { type: Number, required: true },
  madhyama_pratham: { type: Number, required: true },
  madhyama_purna: { type: Number, required: true },
  madhyama_purna_batch1: { type: Number, required: true },
  visharad_pratham: { type: Number, required: true },
  visharad_purna: { type: Number, required: true },
  chote_nartak: { type: Number, required: true },
  registration: { type: Number, required: true },
});

const feesModel = mongoose.model("Fees", feesSchema);

export default feesModel;
