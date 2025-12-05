const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  console.log('Login request received:', req.body.email);
  try {
    const { email, password } = req.body;
    
    console.log('Querying database for user...');
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    console.log('Database query complete. Users found:', users.length);
    
    if (users.length === 0) {
      console.log('User not found');
      return res.json({ success: false, error: 'Invalid credentials' });
    }
    
    const user = users[0]; 
     let isValid = false;
    const inputPassword = password; // Password from request body

    console.log('Verifying password...');
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
      // Password is hashed, use bcrypt
      console.log('Password is hashed, using bcrypt...');
      isValid = await bcrypt.compare(inputPassword, user.password);
    } else {
      // Password is plain text (for old accounts)
      console.log('Password is plain text...');
      isValid = user.password === inputPassword;
    }
    console.log('Password verification result:', isValid);

    
    //const isValid = await bcrypt.compare(password, user.password);
    // const isValid = user.password === password; 
    
    if (!isValid) {
      console.log('Invalid password');
      return res.json({ success: false, error: 'Invalid credentials' });
    }
    
    console.log('Generating token...');
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('Login successful, sending response');
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const [existingUsers] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.json({ success: false, error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'user']
    );
    
    const token = jwt.sign(
      { userId: result.insertId, email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      user: {
        id: result.insertId,
        name,
        email,
        role: 'user'
      },
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
