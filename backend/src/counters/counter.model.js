import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // e.g. "feedback-2026"
    seq: { type: Number, default: 0 },
  },
  { versionKey: false, timestamps: false }
);

/**
 * Atomically increment the counter for the given key and return the new value.
 * Creates the counter document if it does not exist.
 */
counterSchema.statics.nextSeq = async function nextSeq(key, session = null) {
  const opts = session ? { session, new: true, upsert: true } : { new: true, upsert: true };
  const doc = await this.findOneAndUpdate({ _id: key }, { $inc: { seq: 1 } }, opts);
  return doc.seq;
};

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;

