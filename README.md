# Titan Cargo Backend System

A comprehensive backend API for the Titan Cargo booking portal, built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based authentication with role-based access
- **Booking Management** - Create, track, and manage cargo bookings
- **Trip Management** - Track vehicle trips with fuel and distance monitoring
- **Fleet Management** - Monitor vehicle status and assignments
- **Dashboard Analytics** - Real-time statistics and reporting
- **RESTful API** - Clean, well-structured API endpoints

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd "c:\Users\Norris Frank\Desktop\Projects\Cargo"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)
   Create a `.env` file in the root directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/titan_cargo
   JWT_SECRET=your_jwt_secret_key_here
   PORT=3000
   NODE_ENV=development
   ```

4. **Start MongoDB** (if using local instance)
   ```bash
   # Start MongoDB service
   mongod
   ```

5. **Run the backend**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get all bookings (user's or admin)
- `GET /api/bookings/:id` - Get specific booking
- `PUT /api/bookings/:id/status` - Update booking status

### Trips
- `POST /api/trips` - Create new trip
- `GET /api/trips` - Get all trips
- `PUT /api/trips/:id/status` - Update trip status

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `PUT /api/vehicles/:id/status` - Update vehicle status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🗄️ Database Models

### User
- Basic user information (name, email, password)
- Role-based access (admin, user, driver, pilot)
- Contact information and timestamps

### Booking
- Cargo details and specifications
- Route information (from/to, dates)
- Status tracking and payment information
- Unique airway bill numbers

### Trip
- Vehicle and driver assignments
- Route and timing information
- Fuel consumption and distance tracking
- Border control and tax documentation

### Vehicle
- Fleet management (planes, ships, trains, trucks)
- Status tracking (operating, maintenance, grounded)
- Driver assignments and location tracking

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login** to get a token
2. **Include token** in request headers:
   ```
   Authorization: Bearer <your_jwt_token>
   ```
3. **Token expires** after 24 hours

## 🏗️ Architecture

Following the MVP stack structure:

- **server.js** (40-80 LOC) - Entry point and Express configuration
- **Routes** (80-150 LOC) - RESTful API endpoints
- **Controllers** (100-200 LOC) - Business logic handling
- **Models** (50-100 LOC) - MongoDB schemas
- **Middleware** (50-100 LOC) - Authentication, error handling, logging
- **Config** (20-30 LOC) - Environment configuration

**Total: ~350-650 lines of code**

## 🧪 Testing the API

### Using cURL or Postman:

1. **Register a new user:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
   -H "Content-Type: application/json" \
   -d '{
     "name": "Norris Frank",
     "email": "norrisfrankmeyo@gmail.com",
     "password": "password123",
     "role": "admin"
   }'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{
     "email": "norrisfrankmeyo@gmail.com",
     "password": "password123"
   }'
   ```

3. **Create a booking (with token):**
   ```bash
   curl -X POST http://localhost:3000/api/bookings \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer <your_token>" \
   -d '{
     "cargoDetails": {
       "description": "Electronics - 20 boxes",
       "weight": 1200,
       "type": "general"
     },
     "route": {
       "from": "LAX",
       "to": "JFK",
       "departureDate": "2025-03-10T08:00:00Z",
       "arrivalDate": "2025-03-11T14:00:00Z"
     },
     "price": 2500
   }'
   ```

## 🔧 Configuration

### Environment Variables:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

### CORS Configuration:
The backend is configured to accept requests from:
- `http://localhost:3000`
- `http://127.0.0.1:5500`
- `file://` (for local HTML files)

## 📈 Dashboard Integration

The backend provides real-time data for the frontend dashboard:
- Revenue statistics
- Booking counts and status
- Trip information
- Vehicle fleet status
- Recent activity

## 🚀 Deployment

### Local Development:
```bash
npm run dev
```

### Production:
```bash
npm start
```

### Docker (optional):
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```


## 👨‍💻 Author

**Norris Frank** - Titan Cargo Backend Developer

---

**Total Backend Lines of Code: ~400-600 lines**
**Architecture: MVC pattern with Express.js and MongoDB**
**Authentication: JWT-based with role-based access control** 
"# Titan-Cargo-" 
