const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Content Type test
app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
const DB_URL = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/social_media_app';
mongoose.connect(DB_URL)
    .then(() => {
        console.log('MongoDB Connected...');
        app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    })
    .catch(err => {
        console.error(err.message);
        process.exit(1);
    });
