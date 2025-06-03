const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const connectToMongo = require('./db');

const providerRoutes = require('./routes/Provider');
const addServiceRoute = require('./routes/Addservice');
const addAuthUserRoute = require('./routes/Authuser.js');
const adminRoutes = require('./routes/Admin');
const providerProfileRoutes = require('./routes/Providerprofile'); 
const profileRoutes = require("./routes/profile");
const bookingrequestRoutes = require('./routes/BookingRequest'); 
const { applyDefaults } = require('./models/profile.js');
const favoriteRoutes = require('./routes/Favorite'); 
const providerRequestRoutes = require('./routes/providerrequests.js');
const feedbackRoutes = require("./routes/Feedback.js");  // Keep this as the main feedback route
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require('./routes/Booking');
const trackingRoutes = require("./routes/TrackingR.js");
const reviewRoutes = require('./routes/providerfeedback.js'); // path of the feedback route
const emergencyRoutes = require('./routes/Emergency');
const providerhistoryRoutes = require("./routes/providerhistory");
const servicesRoutes = require("./routes/service.js");
const adminFeedbackRoutes = require('./routes/AdminFeedback');
const providerFeedbackSummary = require('./routes/providerFeedbackSummary');

const BlockedProvider = require('./routes/BlockedProvider'); // Adjust path if necessary






require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Uploads directory created');
}

app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectToMongo(); 
app.use('/api/Provider', BlockedProvider);

// Only one feedback route is needed
app.use('/api/feedback', feedbackRoutes);  // This will handle feedback requests
app.use('/api/reviews', reviewRoutes);  // Route name changed to /api/reviews
// Other routes
app.use('/api/providerhistory' , providerhistoryRoutes );
app.use('/api/service' , servicesRoutes );
app.use('/api/Provider', providerRoutes);
app.use('/api/Addservice', addServiceRoute);
app.use('/api/Authuser', addAuthUserRoute);
app.use('/api/Admin', adminRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use("/api", require("./routes/Authuser")); 
app.use('/api/admin-feedback', providerFeedbackSummary);

// Other routes
app.use('/api/admin-feedback', adminFeedbackRoutes);  // Add this line
app.use("/api/profile", profileRoutes);
app.use('/api/providerprofile', providerProfileRoutes);
app.use('/api/Favorite/', favoriteRoutes);
app.use('/api/Booking', bookingRoutes);
app.use('/api/providerrequest', providerRequestRoutes);

app.use("/api/tracking", trackingRoutes);
app.use('/api/BookingRequest', bookingrequestRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
