import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  answer: { type: String, required: true },
  answeredAt: { type: Date, default: Date.now },
  answeredBy: { type: String, default: 'Admin' }
});

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  name: { type: String, default: 'Anonymous' },
  email: String,
  createdAt: { type: Date, default: Date.now },
  replies: [replySchema],
  isAnswered: { type: Boolean, default: false },
  ipAddress: String, // For rate limiting
  userAgent: String
});

export default mongoose.models.Question || mongoose.model('Question', questionSchema);
