import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import http from 'http';
import connectDB from './config/db.js';
import express from 'express';
import path from 'path';
// Load environment variables

// Server setup
const PORT = process.env.PORT;
const server = http.createServer(app);

// Serve uploads folder at /uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'src/uploads')));

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Faraway is running on port ${PORT}`);
    });
});
