import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'VAL Core Backend',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/adapters', (req, res) => {
  res.json({
    message: 'VAL Core Adapters API',
    adapters: ['Tango', 'Arcus', 'Moov', 'Square', 'Instacart']
  });
});

app.use('/api/transactions', (req, res) => {
  res.json({
    message: 'VAL Core Transactions API',
    endpoint: '/api/transactions'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ VAL Core Backend running on http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
