const express = require('express');
const router = express.Router();
const Staff = require('../models/staff');
const bcrypt = require('bcrypt');

// 顯示註冊頁面
router.get('/', (req, res) => {
    res.render('staffRegistration');
});

// 處理註冊請求
router.post('/', async (req, res) => {
    try {
        const { username, password, referee } = req.body;

        // 檢查 referee code
        if (referee !== 's1234') {
            return res.status(400).json({ error: 'Invalid referee code' });
        }

        // 檢查用戶名是否已存在
        const existingStaff = await Staff.findOne({ username });
        if (existingStaff) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // 加密密碼
        const hashedPassword = await bcrypt.hash(password, 10);

        // 創建新staff
        const newStaff = new Staff({
            username,
            password: hashedPassword
        });

        // 儲存到數據庫
        await newStaff.save();

        // 註冊成功後重定向到登入頁面
        res.redirect('/staffLogin');

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

module.exports = router;
