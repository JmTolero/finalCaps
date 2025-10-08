// const axios = require("axios");
require("dotenv").config();
const app = require('./app')


const PORT = process.env.PORT || 3001;

// Listen on all network interfaces (0.0.0.0) to allow access from other devices
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local access: http://localhost:${PORT}`);
    console.log(`Network access: http://0.0.0.0:${PORT}`);
    console.log(`For testing on other devices, use your computer's IP address (run 'ipconfig' to find it)`);
});
    