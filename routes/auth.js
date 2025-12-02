import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();
const router = express.Router();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.PASS_KEY
  }
});

router.post('/send-code', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const code = Math.floor(100000 + Math.random() * 900000);
    const tempToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '15m' });

    await pool.query(
      `INSERT INTO email_verification (email, code, token)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
       SET code = $2, token = $3, created_at = now()`,
      [email, code, tempToken]
    );

    await transporter.sendMail({
      from: process.env.EMAIL_ID,
      to: email,
      subject: 'Your Verification Code',
      text: `Your OTP is ${code}`
    });

    res.json({ message: 'OTP sent', token: tempToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-email', async (req, res) => {
  const { email, code, token } = req.body;
  if (!email || !code || !token) {
    return res.status(400).json({ error: 'Email, code, and token required' });
  }

  try {
    const record = await pool.query('SELECT * FROM email_verification WHERE email = $1', [email]);
    if (record.rows.length === 0) {
      return res.status(400).json({ error: 'No OTP requested' });
    }

    const { code: savedCode, token: savedToken } = record.rows[0];

    if (savedToken !== token) {
      return res.status(401).json({ error: 'Token mismatch' });
    }

    if (parseInt(code, 10) !== parseInt(savedCode) ) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const verifyToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await pool.query(
      'UPDATE email_verification SET token = $1, code = NULL WHERE email = $2',
      [verifyToken, email]
    );

    res.json({ message: 'Email verified', token: verifyToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, phone, dob, address, token } = req.body;
  if (!firstName || !lastName || !email || !password || !phone || !dob || !address || !token) {
    return res.status(400).json({ error: 'All fields including token are required' });
  }

  try {
    const record = await pool.query('SELECT * FROM email_verification WHERE email = $1', [email]);
    if (record.rows.length === 0) {
      return res.status(400).json({ error: 'Email verification required' });
    }

    const { token: savedToken } = record.rows[0];
    if (!savedToken || savedToken !== token) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    jwt.verify(savedToken, process.env.JWT_SECRET);

    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, phone, dob, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, first_name, last_name, email, phone, dob, address`,
      [firstName, lastName, email, hashedPassword, phone, dob, address]
    );

    await pool.query('DELETE FROM email_verification WHERE email = $1', [email]);

    const loginToken = jwt.sign(
      { userId: newUser.rows[0].id, email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      user: newUser.rows[0],
      token: loginToken
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.rows[0].id, email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/account', authMiddleware, async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT id, first_name, last_name, email, phone, dob, address, created_at
       FROM users WHERE id = $1`,
      [req.user.userId]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: user.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/account', authMiddleware, async (req, res) => {
  const { firstName, lastName, phone, dob, address } = req.body;
  try {
    const updatedUser = await pool.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, phone = $3, dob = $4, address = $5
       WHERE id = $6
       RETURNING id, first_name, last_name, email, phone, dob, address, created_at`,
      [firstName, lastName, phone, dob, address, req.user.userId]
    );
    res.json({ message: 'Account updated successfully', user: updatedUser.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
