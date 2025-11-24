import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  name: { type: String, default: "Anonymous" },
  story: { type: String, default: "" },
  voiceUrl: { type: String, default: "" },
  date: { type: Date, default: Date.now },
});

// ✅ Prevent redeclaration if model exists
const Story = mongoose.models.Story || mongoose.model("Story", storySchema);

export default Story;
