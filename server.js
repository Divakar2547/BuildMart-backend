const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://buildmart-backend-5x3k.onrender.com',
      'https://divakar2547.github.io',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    if (!origin || allowed.includes(origin) || origin.endsWith('.render.com') || origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Root route for Render / health checks
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'BuildMart API is running',
    health: '/api/health'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'BuildMart API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Connect to MongoDB & Start Server
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buildmart';

const ensureDefaultUser = async () => {
  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ email: 'admin@buildmart.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@buildmart.com',
        password: 'admin123',
        role: 'admin',
        phone: '9876543210'
      });
      console.log('✅ Created default admin user: admin@buildmart.com / admin123');
    }
  } catch (error) {
    console.error('⚠️ Could not create default admin user:', error.message);
  }
};

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    await ensureDefaultUser();
    app.listen(PORT, () => {
      console.log(`🚀 BuildMart server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
