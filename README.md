# USDE Enterprise Platform

A comprehensive stablecoin enterprise platform built with React, Node.js, and PostgreSQL, designed for businesses to manage USDE stablecoins with features like payments, staking, and yield generation.

## Features

- **Enterprise Registration & KYC**: Complete company onboarding with document verification
- **USDE Minting**: Deposit USD and mint USDE stablecoins
- **Payment System**: Send USDE payments to suppliers with lock-in periods
- **Staking & Yield**: Lock USDE for fixed periods and earn interest (4% APY)
- **Withdrawal System**: Burn USDE and withdraw USD
- **Dashboard**: Comprehensive overview of balances, earnings, and activities
- **Security**: JWT authentication, rate limiting, and secure API endpoints

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database with Prisma ORM
- **JWT** authentication
- **Stripe** integration for payments
- **Nodemailer** for email notifications
- **Node-cron** for automated earnings calculation

### Frontend
- **React** 18 with functional components and hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API communication
- **React Hot Toast** for notifications

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd USDE
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/env.example backend/.env
   # Edit backend/.env with your database and API keys
   ```

4. **Set up database**
   ```bash
   cd backend
   npm run db:generate
   npm run db:push
   ```

5. **Start the application**
   ```bash
   # From the root directory
   ./start-services.sh
   ```

   Or manually:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm start
   ```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/usde_platform"
DATABASE_PUBLIC_URL="postgresql://username:password@localhost:5430/usde_platform"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key"

# Email (optional for development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Stripe (optional for development)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"

# Server
PORT=5000
NODE_ENV="development"
```

## Railway Deployment

For production deployment on Railway:

1. **Connect your GitHub repository to Railway**
2. **Set environment variables in Railway dashboard**
3. **Deploy automatically on git push**

### Railway Environment Variables
```env
DATABASE_URL="postgresql://postgres:password@railway.internal:5432/railway"
DATABASE_PUBLIC_URL="postgresql://postgres:password@railway.proxy:port/railway"
JWT_SECRET="your-production-jwt-secret"
NODE_ENV="production"
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new company
- `POST /api/auth/login` - Login company
- `GET /api/auth/profile` - Get company profile

### Company Management
- `PUT /api/company/profile` - Update company profile
- `POST /api/company/kyc/upload` - Upload KYC documents
- `GET /api/company/kyc/status` - Get KYC status

### Payments
- `POST /api/payment/send` - Send payment to supplier
- `GET /api/payment/history` - Get payment history
- `POST /api/payment/release/:id` - Release locked payment

### Stakes
- `GET /api/stake` - Get all stakes
- `POST /api/stake` - Create new stake
- `GET /api/stake/:id` - Get stake details
- `GET /api/stake/stats/summary` - Get stake statistics

### Deposits
- `POST /api/deposit` - Create deposit
- `GET /api/deposit` - Get deposit history
- `POST /api/deposit/:id/complete` - Complete deposit

### Withdrawals
- `POST /api/withdrawal` - Create withdrawal
- `GET /api/withdrawal` - Get withdrawal history
- `POST /api/withdrawal/:id/complete` - Complete withdrawal

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/earnings` - Get earnings history
- `GET /api/dashboard/performance` - Get performance metrics

## Database Schema

The application uses PostgreSQL with the following main tables:

- **companies**: Company information and KYC status
- **payments**: Payment transactions between companies
- **stakes**: Locked USDE amounts with interest rates
- **earnings**: Daily interest earnings from stakes
- **deposits**: USDE minting transactions
- **withdrawals**: USDE burning transactions

## Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Run database migrations
```

### Frontend Development
```bash
cd frontend
npm start            # Start development server
npm run build        # Build for production
```

### Testing
```bash
# Backend tests (when implemented)
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Project Structure

```
USDE/
├── backend/                 # Node.js API server
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   ├── prisma/             # Database schema and migrations
│   └── server.js           # Express server setup
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   └── App.js          # Main application component
│   └── public/             # Static assets
├── docs/                   # Documentation
├── public/                 # Design assets and icons
└── start-services.sh       # Development startup script
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository. 