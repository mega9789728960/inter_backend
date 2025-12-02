# Express Auth API

A secure and straightforward authentication API built with Express and PostgreSQL. This project handles user registration, email verification, login, and profile management with JWT-based authentication.

## Features

- **Email Verification** - Send OTP codes via email before registration
- **User Registration** - Create new accounts with proper validation
- **Secure Login** - JWT-based authentication with password hashing
- **Profile Management** - View and update user information
- **CORS Support** - Configured for cross-origin requests
- **Password Security** - Bcryptjs hashing with salt rounds
- **Environment Variables** - Secure configuration management

## Tech Stack

- **Backend Framework**: Express.js 4.18.2
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: Bcryptjs 2.4.3
- **Email Service**: Nodemailer 7.0.11
- **Server**: Node.js
- **Development**: Nodemon for auto-reload

## Prerequisites

Before you start, make sure you have:

- Node.js (v14 or higher)
- PostgreSQL database access (or Supabase account)
- Gmail account for email sending
- Git (optional, for cloning)

## Getting Started

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd express
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory with the following variables:

```
JWT_SECRET=your_secure_jwt_secret_key_here
EMAIL_ID=your_gmail_address@gmail.com
PASS_KEY=your_gmail_app_password
```

**Note**: For Gmail, generate an [App Password](https://myaccount.google.com/apppasswords) instead of using your regular password.

### 3. Database Configuration

Update the database credentials in `db.js`:

```javascript
const pool = new Pool({
  user: 'your_db_user',
  host: 'your_db_host',
  database: 'your_db_name',
  password: 'your_db_password',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});
```

The project uses PostgreSQL. You'll need to create the following tables:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  dob DATE,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_verification (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  code INTEGER,
  token VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Running the Server

For development with auto-reload:

```bash
npm run dev
```

For production:

```bash
npm start
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### Authentication Routes

All endpoints are prefixed with the base URL (e.g., `http://localhost:5000`).

#### Send OTP Code

**POST** `/send-code`

Sends a verification code to the provided email address.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "message": "OTP sent",
  "token": "jwt_token_here"
}
```

#### Verify Email

**POST** `/verify-email`

Verifies the OTP code sent to the email.

**Request Body**:
```json
{
  "email": "user@example.com",
  "code": "123456",
  "token": "jwt_token_from_send_code"
}
```

**Response**:
```json
{
  "message": "Email verified",
  "token": "verified_jwt_token"
}
```

#### Register User

**POST** `/register`

Creates a new user account after email verification.

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+1234567890",
  "dob": "1990-01-15",
  "address": "123 Main St",
  "token": "verified_jwt_token"
}
```

**Response**:
```json
{
  "message": "Registration successful",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "dob": "1990-01-15",
    "address": "123 Main St"
  },
  "token": "login_jwt_token"
}
```

#### Login

**POST** `/login`

Authenticates a user with email and password.

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "message": "Login successful",
  "token": "jwt_token_here"
}
```

#### Get User Profile

**GET** `/account`

Retrieves the logged-in user's profile information. Requires authentication.

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "dob": "1990-01-15",
    "address": "123 Main St",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Update User Profile

**PUT** `/account`

Updates the logged-in user's profile information. Requires authentication.

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+9876543210",
  "dob": "1990-01-15",
  "address": "456 New St"
}
```

**Response**:
```json
{
  "message": "Account updated successfully",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Smith",
    "email": "john@example.com",
    "phone": "+9876543210",
    "dob": "1990-01-15",
    "address": "456 New St",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

## Authentication

This API uses JWT (JSON Web Tokens) for authentication. After logging in or verifying your email, you'll receive a token that must be included in the `Authorization` header for protected endpoints:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens are set to expire after 1 hour. You'll need to log in again after expiration.

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400` - Bad Request (missing or invalid data)
- `401` - Unauthorized (invalid token or credentials)
- `404` - Not Found (user doesn't exist)
- `500` - Internal Server Error

**Example Error Response**:
```json
{
  "error": "Invalid credentials"
}
```

## CORS Configuration

The API is configured to accept requests from:
- `https://inter-frontend-liard.vercel.app`

To change this, modify the `origin` in `app.js`.

## Deployment

This project is configured for deployment on Vercel. The `vercel.json` file handles routing.

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

The API will be available at your Vercel URL.

## Project Structure

```
express/
├── routes/
│   └── auth.js           # Authentication endpoints
├── app.js                # Express app configuration
├── db.js                 # Database connection
├── server.js             # Server entry point
├── package.json          # Project dependencies
├── .env                  # Environment variables (git-ignored)
├── vercel.json           # Vercel deployment config
└── README.md             # This file
```

## Security Considerations

- **Passwords**: Always hashed using bcryptjs before storing
- **JWT Secret**: Keep your JWT_SECRET strong and confidential
- **Email Credentials**: Use app-specific passwords, not your main Gmail password
- **Database**: Use SSL connections when available
- **Environment Variables**: Never commit `.env` to version control

## Troubleshooting

**Email not sending?**
- Verify Gmail credentials are correct
- Check that you're using an App Password, not your regular password
- Ensure 2-Factor Authentication is enabled on your Gmail account

**Connection refused error?**
- Check database host and port are correct
- Verify database is running
- Ensure network connection is available

**JWT errors?**
- Verify your JWT_SECRET is set correctly
- Check token hasn't expired
- Ensure token format is `Bearer <token>`

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please open an issue on the repository or contact the maintainer.
