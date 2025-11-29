const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { testConnection } = require('./config/database');
const { reminderJob } = require('./utils/reminderCron');

// Load env vars
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const fileRoutes = require('./routes/files');
const taskRoutes = require('./routes/tasks');
const statsRoutes = require('./routes/stats');
const expenseRoutes = require('./routes/expenses');
const documentRoutes = require('./routes/documents');

// ✅ الروoutes الجديدة
const caseTypeRoutes = require('./routes/caseTypes');
const caseRoutes = require('./routes/cases');
const caseEventRoutes = require('./routes/caseEvents');

const app = express();

// Test database connection
testConnection();

// Start reminder cron job
console.log('⏰ Starting reminder cron jobs...');
reminderJob.start();
console.log('✅ Reminder cron jobs started');

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/documents', documentRoutes);

// ✅ Routes الجديدة
app.use('/api/case-types', caseTypeRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/case-events', caseEventRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});