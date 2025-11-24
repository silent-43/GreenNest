import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  profilePic: { type: String, default: "" },
  otp: { type: String },
  otpExpire: { type: Date },
  cart: [
    {
      productId: String,
      name: String,
      price: Number,
      image: String,
      quantity: { type: Number, default: 1 },
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

// ✅ Prevent redeclaration if model exists
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
