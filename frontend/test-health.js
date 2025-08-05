const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'frontend'
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Frontend server running on port ${PORT}`);
  console.log(`🌐 Health check available at /health`);
  console.log(`📱 React app served from /`);
}); 