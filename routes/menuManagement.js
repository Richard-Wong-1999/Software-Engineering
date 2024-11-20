const express = require('express');
const router = express.Router();
const Menu = require('../models/menu');

// 顯示菜單頁面
router.get('/', async (req, res) => {
    try {
        const menuItems = await Menu.find();
        res.render('staffMenuManagement', { menuItems });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// 新增菜單項目
router.post('/add', async (req, res) => {
    try {
        const newItem = new Menu({
            name: req.body.name,
            price: req.body.price
        });
        await newItem.save();
        res.redirect('/menuManagement');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// 編輯菜單項目
router.post('/edit/:id', async (req, res) => {
    try {
        await Menu.findByIdAndUpdate(req.params.id, {
            name: req.body.name,
            price: req.body.price
        });
        res.redirect('/menuManagement');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// 刪除菜單項目
router.post('/delete/:id', async (req, res) => {
    try {
        await Menu.findByIdAndDelete(req.params.id);
        res.redirect('/menuManagement');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;
