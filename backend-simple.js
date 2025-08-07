const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== CONFIG ====================
const config = {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
};

// ==================== MIDDLEWARE ====================
// CORS middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'file://', '*'],
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files middleware
app.use(express.static(path.join(__dirname)));

// Request logging middleware
const requestLogger = (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
};

app.use(requestLogger);

// ==================== MOCK DATA ====================
const mockData = {
    stats: {
        totalBookings: 42,
        totalRevenue: 348250,
        totalTrips: 15,
        totalVehicles: 8
    },
    bookings: [
        {
            _id: '1',
            airwayBill: 'AWB123456',
            cargoDetails: {
                description: 'Electronics - 20 boxes',
                weight: 1200,
                type: 'general'
            },
            route: {
                from: 'LAX',
                to: 'JFK',
                departureDate: '2025-03-10T08:00:00Z',
                arrivalDate: '2025-03-11T14:00:00Z'
            },
            status: 'in-transit',
            price: 2500,
            clientId: { name: 'Acme Corp', email: 'acme@example.com' }
        },
        {
            _id: '2',
            airwayBill: 'AWB123457',
            cargoDetails: {
                description: 'Pharmaceuticals - 10 pallets',
                weight: 3500,
                type: 'hazardous'
            },
            route: {
                from: 'DFW',
                to: 'MIA',
                departureDate: '2025-03-12T10:30:00Z',
                arrivalDate: '2025-03-13T16:45:00Z'
            },
            status: 'confirmed',
            price: 4200,
            clientId: { name: 'HealthPlus', email: 'contact@healthplus.com' }
        }
    ],
    trips: [
        {
            _id: '1',
            tripId: 'FLT-900',
            vehicleId: { type: 'plane', model: 'Boeing 747-8F' },
            driverId: { name: 'Alex King' },
            coDriverId: { name: 'Sara Queen' },
            route: {
                from: 'JFK',
                to: 'LAX',
                departureTime: '2025-03-10T09:00:00Z',
                arrivalTime: '2025-03-10T13:00:00Z'
            },
            fuelUsed: 2500,
            distance: 2200,
            status: 'completed'
        }
    ],
    vehicles: [
        { _id: '1', type: 'plane', status: 'operating', currentLocation: 'JFK' },
        { _id: '2', type: 'ship', status: 'operating', currentLocation: 'Port of LA' },
        { _id: '3', type: 'truck', status: 'operating', currentLocation: 'Dallas' },
        { _id: '4', type: 'train', status: 'maintenance', currentLocation: 'Chicago' }
    ]
};

// ==================== ROUTES ====================
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Titan Cargo Backend is running',
        timestamp: new Date().toISOString()
    });
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
    res.json(mockData.stats);
});

// Get all bookings
app.get('/api/bookings', (req, res) => {
    res.json(mockData.bookings);
});

// Get all trips
app.get('/api/trips', (req, res) => {
    res.json(mockData.trips);
});

// Get all vehicles
app.get('/api/vehicles', (req, res) => {
    res.json(mockData.vehicles);
});

// Authentication endpoints (mock)
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Mock authentication
    if (email === 'norrisfrankmeyo@gmail.com' && password === 'password123') {
        res.json({
            message: 'Login successful',
            token: 'mock_jwt_token_12345',
            user: {
                id: '1',
                name: 'Norris Frank',
                email: 'norrisfrankmeyo@gmail.com',
                role: 'admin'
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role } = req.body;
    
    res.json({
        message: 'User registered successfully',
        token: 'mock_jwt_token_12345',
        user: {
            id: '1',
            name: name,
            email: email,
            role: role || 'user'
        }
    });
});

// Create booking
app.post('/api/bookings', (req, res) => {
    const newBooking = {
        _id: Date.now().toString(),
        airwayBill: 'AWB' + Date.now(),
        ...req.body,
        status: 'pending',
        createdAt: new Date()
    };
    
    mockData.bookings.push(newBooking);
    res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
});

// Update booking status
app.put('/api/bookings/:id/status', (req, res) => {
    const { status } = req.body;
    const booking = mockData.bookings.find(b => b._id === req.params.id);
    
    if (booking) {
        booking.status = status;
        res.json({ message: 'Booking status updated', booking });
    } else {
        res.status(404).json({ error: 'Booking not found' });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle 404 errors
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ==================== START SERVER ====================
app.listen(config.port, () => {
    console.log(`🚀 Titan Cargo Backend (Simple) running on port ${config.port}`);
    console.log(`📊 Environment: ${config.environment}`);
    console.log(`🌐 API Base URL: http://localhost:${config.port}/api`);
    console.log(`📁 Static files served from: ${__dirname}`);
    console.log(`✅ Health check: http://localhost:${config.port}/api/health`);
    console.log(`📋 Available endpoints:`);
    console.log(`   - GET  /api/health`);
    console.log(`   - GET  /api/dashboard/stats`);
    console.log(`   - GET  /api/bookings`);
    console.log(`   - GET  /api/trips`);
    console.log(`   - GET  /api/vehicles`);
    console.log(`   - POST /api/auth/login`);
    console.log(`   - POST /api/auth/register`);
    console.log(`   - POST /api/bookings`);
    console.log(`   - PUT  /api/bookings/:id/status`);
});

module.exports = app; 