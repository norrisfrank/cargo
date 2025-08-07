const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== CONFIG (20-30 LOC) ====================
const config = {
    mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/titan_cargo',
    jwtSecret: process.env.JWT_SECRET || 'titan_cargo_secret_key_2025',
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
};

// ==================== MIDDLEWARE (50-100 LOC) ====================
// CORS middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'file://'],
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files middleware
app.use(express.static(path.join(__dirname)));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, config.jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: config.environment === 'development' ? err.message : 'Internal server error'
    });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
};

app.use(requestLogger);

// ==================== MODELS (50-100 LOC) ====================
// User Model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user', 'driver', 'pilot'], default: 'user' },
    phone: String,
    address: String,
    createdAt: { type: Date, default: Date.now },
    lastLogin: Date
});

// Booking Model
const bookingSchema = new mongoose.Schema({
    airwayBill: { type: String, required: true, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cargoDetails: {
        description: { type: String, required: true },
        weight: { type: Number, required: true },
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        },
        type: { type: String, enum: ['general', 'hazardous', 'perishable', 'valuable'], default: 'general' }
    },
    route: {
        from: { type: String, required: true },
        to: { type: String, required: true },
        departureDate: { type: Date, required: true },
        arrivalDate: { type: Date, required: true }
    },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'in-transit', 'delivered', 'cancelled'], 
        default: 'pending' 
    },
    price: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Vehicle/Fleet Model
const vehicleSchema = new mongoose.Schema({
    vehicleId: { type: String, required: true, unique: true },
    type: { type: String, enum: ['plane', 'ship', 'train', 'truck'], required: true },
    model: String,
    capacity: Number,
    status: { type: String, enum: ['operating', 'maintenance', 'grounded'], default: 'operating' },
    currentLocation: String,
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Trip Model
const tripSchema = new mongoose.Schema({
    tripId: { type: String, required: true, unique: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
    route: {
        from: String,
        to: String,
        departureTime: Date,
        arrivalTime: Date
    },
    fuelUsed: Number,
    distance: Number,
    status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], default: 'scheduled' },
    borderControlPermit: String,
    taxValuationPayment: Number,
    deliveryConfirmationReceipt: String,
    createdAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const Trip = mongoose.model('Trip', tripSchema);

// ==================== CONTROLLERS (100-200 LOC) ====================
// User Controller
const userController = {
    // Register new user
    register: async (req, res) => {
        try {
            const { name, email, password, role, phone, address } = req.body;
            
            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Create new user
            const user = new User({
                name,
                email,
                password: hashedPassword,
                role,
                phone,
                address
            });

            await user.save();
            
            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id, email: user.email, role: user.role },
                config.jwtSecret,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Login user
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id, email: user.email, role: user.role },
                config.jwtSecret,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get user profile
    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.userId).select('-password');
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Update user profile
    updateProfile: async (req, res) => {
        try {
            const { name, phone, address } = req.body;
            const user = await User.findByIdAndUpdate(
                req.user.userId,
                { name, phone, address },
                { new: true }
            ).select('-password');
            
            res.json({ message: 'Profile updated successfully', user });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// Booking Controller
const bookingController = {
    // Create new booking
    createBooking: async (req, res) => {
        try {
            const {
                cargoDetails,
                route,
                price
            } = req.body;

            // Generate unique airway bill number
            const airwayBill = 'AWB' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

            const booking = new Booking({
                airwayBill,
                clientId: req.user.userId,
                cargoDetails,
                route,
                price
            });

            await booking.save();
            res.status(201).json({ message: 'Booking created successfully', booking });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get all bookings (admin) or user's bookings
    getBookings: async (req, res) => {
        try {
            let query = {};
            if (req.user.role !== 'admin') {
                query.clientId = req.user.userId;
            }

            const bookings = await Booking.find(query)
                .populate('clientId', 'name email')
                .sort({ createdAt: -1 });

            res.json(bookings);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get booking by ID
    getBookingById: async (req, res) => {
        try {
            const booking = await Booking.findById(req.params.id)
                .populate('clientId', 'name email');
            
            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            // Check if user has permission to view this booking
            if (req.user.role !== 'admin' && booking.clientId.toString() !== req.user.userId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            res.json(booking);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Update booking status
    updateBookingStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const booking = await Booking.findByIdAndUpdate(
                req.params.id,
                { status, updatedAt: new Date() },
                { new: true }
            );

            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            res.json({ message: 'Booking status updated', booking });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// Trip Controller
const tripController = {
    // Create new trip
    createTrip: async (req, res) => {
        try {
            const {
                vehicleId,
                driverId,
                coDriverId,
                route,
                bookings
            } = req.body;

            // Generate unique trip ID
            const tripId = 'FLT-' + Date.now();

            const trip = new Trip({
                tripId,
                vehicleId,
                driverId,
                coDriverId,
                route,
                bookings
            });

            await trip.save();
            res.status(201).json({ message: 'Trip created successfully', trip });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get all trips
    getTrips: async (req, res) => {
        try {
            const trips = await Trip.find()
                .populate('vehicleId')
                .populate('driverId', 'name')
                .populate('coDriverId', 'name')
                .populate('bookings')
                .sort({ createdAt: -1 });

            res.json(trips);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Update trip status
    updateTripStatus: async (req, res) => {
        try {
            const { status, fuelUsed, distance } = req.body;
            const trip = await Trip.findByIdAndUpdate(
                req.params.id,
                { status, fuelUsed, distance, updatedAt: new Date() },
                { new: true }
            );

            if (!trip) {
                return res.status(404).json({ error: 'Trip not found' });
            }

            res.json({ message: 'Trip updated successfully', trip });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// Vehicle Controller
const vehicleController = {
    // Get all vehicles
    getVehicles: async (req, res) => {
        try {
            const vehicles = await Vehicle.find()
                .populate('assignedDriver', 'name')
                .sort({ createdAt: -1 });

            res.json(vehicles);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Update vehicle status
    updateVehicleStatus: async (req, res) => {
        try {
            const { status, currentLocation } = req.body;
            const vehicle = await Vehicle.findByIdAndUpdate(
                req.params.id,
                { status, currentLocation },
                { new: true }
            );

            if (!vehicle) {
                return res.status(404).json({ error: 'Vehicle not found' });
            }

            res.json({ message: 'Vehicle status updated', vehicle });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// Dashboard Controller
const dashboardController = {
    // Get dashboard statistics
    getStats: async (req, res) => {
        try {
            const totalBookings = await Booking.countDocuments();
            const totalRevenue = await Booking.aggregate([
                { $match: { paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$price' } } }
            ]);
            const totalTrips = await Trip.countDocuments();
            const totalVehicles = await Vehicle.countDocuments();

            const recentBookings = await Booking.find()
                .populate('clientId', 'name')
                .sort({ createdAt: -1 })
                .limit(10);

            const activeTrips = await Trip.find({ status: 'in-progress' })
                .populate('vehicleId')
                .populate('driverId', 'name');

            res.json({
                stats: {
                    totalBookings,
                    totalRevenue: totalRevenue[0]?.total || 0,
                    totalTrips,
                    totalVehicles
                },
                recentBookings,
                activeTrips
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// ==================== ROUTES (80-150 LOC) ====================
// User routes
app.post('/api/auth/register', userController.register);
app.post('/api/auth/login', userController.login);
app.get('/api/auth/profile', authenticateToken, userController.getProfile);
app.put('/api/auth/profile', authenticateToken, userController.updateProfile);

// Booking routes
app.post('/api/bookings', authenticateToken, bookingController.createBooking);
app.get('/api/bookings', authenticateToken, bookingController.getBookings);
app.get('/api/bookings/:id', authenticateToken, bookingController.getBookingById);
app.put('/api/bookings/:id/status', authenticateToken, bookingController.updateBookingStatus);

// Trip routes
app.post('/api/trips', authenticateToken, tripController.createTrip);
app.get('/api/trips', authenticateToken, tripController.getTrips);
app.put('/api/trips/:id/status', authenticateToken, tripController.updateTripStatus);

// Vehicle routes
app.get('/api/vehicles', authenticateToken, vehicleController.getVehicles);
app.put('/api/vehicles/:id/status', authenticateToken, vehicleController.updateVehicleStatus);

// Dashboard routes
app.get('/api/dashboard/stats', authenticateToken, dashboardController.getStats);

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================== SERVER.JS (40-80 LOC) ====================
// Connect to MongoDB
mongoose.connect(config.mongoURI)
    .then(() => {
        console.log('Connected to MongoDB');
        
        // Start server
        app.listen(config.port, () => {
            console.log(`Titan Cargo Backend running on port ${config.port}`);
            console.log(`Environment: ${config.environment}`);
            console.log(`MongoDB URI: ${config.mongoURI}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Apply error handling middleware
app.use(errorHandler);

// Handle 404 errors
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
    });
});

module.exports = app; 