const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Staff = require('../models/staff');

// Login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find staff member
        const staff = await Staff.findOne({ username });
        
        if (!staff) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        // Compare password
        const isMatch = await staff.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        // Login successful
        res.json({ 
            success: true, 
            message: 'Login successful',
            redirectUrl: '/staffHistorialOrder' // or whatever page you want to redirect to
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Register route
router.post('/register', async (req, res) => {
    try {
        const { username, password, referee } = req.body;

        // Check referee code
        if (referee !== 's1234') {
            return res.status(400).json({ success: false, message: 'Invalid referee code' });
        }

        // Check if username already exists
        const existingStaff = await Staff.findOne({ username });
        if (existingStaff) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new staff member
        const newStaff = new Staff({
            username,
            password: hashedPassword
        });

        await newStaff.save();

        res.json({ 
            success: true, 
            message: 'Registration successful',
            redirectUrl: '/staffLogin'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
