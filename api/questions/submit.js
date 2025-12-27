import connectDB from '../utils/db';
import Question from '../../../models/Question';
import rateLimit from '../../../utils/rateLimit';

// Simple rate limiting
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Apply rate limiting
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await limiter.check(res, 10, ip); // 10 requests per minute
    
    const { question, name, email } = req.body;
    
    // Validation
    if (!question || question.trim().length < 5) {
      return res.status(400).json({ 
        error: 'Question must be at least 5 characters long' 
      });
    }
    
    if (question.length > 1000) {
      return res.status(400).json({ 
        error: 'Question is too long (max 1000 characters)' 
      });
    }
    
    await connectDB();
    
    const newQuestion = new Question({
      question: question.trim(),
      name: (name || 'Anonymous').trim(),
      email: email ? email.trim() : '',
      ipAddress: ip,
      userAgent: req.headers['user-agent']
    });
    
    await newQuestion.save();
    
    res.status(201).json({
      success: true,
      message: 'Question submitted successfully!',
      data: {
        id: newQuestion._id,
        question: newQuestion.question,
        name: newQuestion.name,
        createdAt: newQuestion.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    
    if (error.message === 'Rate limit exceeded') {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.' 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}
