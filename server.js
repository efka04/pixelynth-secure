const express = require('express');
const cors = require('cors');
const app = express();

// Setup CORS middleware
app.use(cors());

// Your existing code here...

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});