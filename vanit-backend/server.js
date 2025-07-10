const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const redisClient = require('./config/redis');

// Import routes
const statsRoutes = require('./routes/statsRoutes');
const contactRoutes = require('./routes/contactRoutes'); 
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const routesRouter = require('./routes/routesRouter');
const adminStudentCaptainRoutes = require('./routes/adminStudentCaptainRoutes');
const emergencyRoutes = require("./routes/emergencyRoutes");
const busTrackingRoutes = require("./routes/busTrackingRoutes");
const captainAuthRoutes = require('./routes/captainAuthRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const captainComplaintRoutes = require('./routes/captainComplaintRoutes');
const locationRoutes = require('./routes/locationRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:4173"],
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 5000;

// Connect to Redis
redisClient.connect().catch(console.error);

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Route Handlers
app.use('/api', statsRoutes);
app.use('/api', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', studentRoutes);
app.use('/api', routesRouter);
app.use('/api/admin', adminStudentCaptainRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/bus-tracking", busTrackingRoutes);
app.use('/api/auth/captains', captainAuthRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/captains/complaints', captainComplaintRoutes);
app.use('/api/captains', require('./routes/captainRoutes'));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use('/api/location', locationRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('subscribe_route', (routeName) => {
        socket.join(`route:${routeName}`);
        console.log(`Client ${socket.id} subscribed to route: ${routeName}`);
    });

    socket.on('unsubscribe_route', (routeName) => {
        socket.leave(`route:${routeName}`);
        console.log(`Client ${socket.id} unsubscribed from route: ${routeName}`);
    });

    socket.on('captain_location_update', (data) => {
        const { captainId, latitude, longitude, timestamp } = data;
        console.log(`Captain ${captainId} location update:`, { latitude, longitude });
        
        socket.broadcast.to(`route:${data.routeName}`).emit('location_update', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Redis subscription for broadcasting location updates
const setupRedisSubscriptions = async () => {
    try {
        await redisClient.subscribe('route:*:locations', (message) => {
            const routeName = message.channel.split(':')[1];
            io.to(`route:${routeName}`).emit('location_update', message.data);
        });

        await redisClient.subscribe('route:*:notifications', (message) => {
            const routeName = message.channel.split(':')[1];
            io.to(`route:${routeName}`).emit('notification', message.data);
        });

        console.log('Redis subscriptions set up successfully');
    } catch (error) {
        console.error('Error setting up Redis subscriptions:', error);
    }
};

// Start server
server.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`WebSocket server is running on ws://localhost:${port}`);
    
    await setupRedisSubscriptions();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await redisClient.disconnect();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await redisClient.disconnect();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

