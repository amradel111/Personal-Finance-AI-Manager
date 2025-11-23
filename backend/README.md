# Personal Finance AI Manager - Backend

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Installation Steps

1. **Install Dependencies**
```bash
npm install
```

This will install:
- express
- dotenv
- cors
- bcryptjs
- jsonwebtoken
- prisma
- @prisma/client
- nodemon (dev dependency)

2. **Set Up Environment Variables**
```bash
cp .env.example .env
```

Then edit `.env` and update:
- `DATABASE_URL` with your PostgreSQL connection string
- `JWT_SECRET` with a secure random string
- `CLIENT_URL` with your frontend URL (default: http://localhost:5173)

3. **Set Up Database**
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

4. **Start Development Server**
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── config/          # Configuration files (database, etc.)
├── controllers/     # Request handlers and business logic
├── middleware/      # Express middleware (auth, validation, etc.)
├── prisma/          # Prisma schema and migrations
├── routes/          # API route definitions
├── utils/           # Helper functions (JWT, password hashing, etc.)
├── server.js        # Entry point
├── .env.example     # Environment variables template
└── package.json     # Dependencies and scripts
```

## 🗄️ Database Schema

The database includes 4 main tables:
- **users** - Authentication data
- **user_profiles** - User profile information (Dataset 1)
- **monthly_expenses** - Monthly spending data (Dataset 2)
- **financial_health** - Financial health assessments (Dataset 3)

## 📚 API Endpoints (To be implemented)

### Authentication
- POST `/api/auth/signup` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/check-profile` - Check if profile is complete

### Profile
- POST `/api/profile` - Create user profile
- GET `/api/profile` - Get user profile
- PUT `/api/profile` - Update user profile

### Expenses
- POST `/api/expenses` - Add monthly expenses
- GET `/api/expenses` - Get all expenses
- GET `/api/expenses/:month_year` - Get expenses for specific month
- PUT `/api/expenses/:id` - Update expenses
- DELETE `/api/expenses/:id` - Delete expenses

### Dashboard
- GET `/api/dashboard/summary` - Get dashboard summary data

### Reports
- GET `/api/reports/monthly/:month_year` - Get monthly report
- GET `/api/reports/history` - Get report history

## 🔧 Development Commands

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Format Prisma schema
npx prisma format
```

## 🔒 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment mode | development |
| DATABASE_URL | PostgreSQL connection string | postgresql://postgres:YOUR_PASSWORD@localhost:5432/finance_manager |
| JWT_SECRET | Secret key for JWT | your_super_secret_jwt_key_change_this_in_production |
| JWT_EXPIRES_IN | JWT expiration time | 7d |
| CLIENT_URL | Frontend URL for CORS | http://localhost:5173 |

## 📝 Notes

- All API routes (except auth endpoints) require JWT authentication
- JWT token should be sent in Authorization header: `Bearer <token>`
- Database uses UUID for primary keys
- All timestamps are in UTC
- Soft delete can be implemented if needed

## 🐛 Troubleshooting

### Database Connection Fails
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists

### Prisma Client Not Found
```bash
npx prisma generate
```

### Migration Issues
```bash
npx prisma migrate reset
npx prisma migrate dev
```
