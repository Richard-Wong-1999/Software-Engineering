const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Menu = require('./models/menu');
const Order = require('./models/order');
const Staff = require('./models/staff');
const staffAuthRoutes = require('./routes/staffAuth');
const app = express();

// 引入路由
const staffRegistrationRoutes = require('./routes/staffRegistration');
const menuManagementRoutes = require('./routes/menuManagement');

const uri = "mongodb+srv://Richard:W12345ong@cluster0.plr6y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// 更新 MongoDB 連接設置
mongoose.connect(uri)
    .then(() => console.log("Connected to MongoDB"))
    .catch(error => console.error("Connection error:", error));

// 設置中間件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// 設置 EJS 模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 設置靜態文件
app.use(express.static('public'));

// 客戶相關路由
app.get('/', (req, res) => {
    res.render('customerWelcome');
});

// 添加創建訂單的路由
app.post('/createOrder', async (req, res) => {
    try {
        const { seat, numberOfPeople } = req.body;
        
        // 創建新訂單
        const newOrder = new Order({
            seat,
            numberOfPeople,
            time: new Date(),
            paymentStatus: 'unpaid',
            items: []
        });

        // 保存訂單
        await newOrder.save();

        // 返回訂單ID
        res.status(200).json({ orderId: newOrder._id });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// 修改customerOrder路由以接收訂單ID
// 修改 server.js 中的 customerOrder 路由
app.get('/customerOrder', async (req, res) => {
    try {
        const orderId = req.query.orderId;
        
        // Get order information
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Check if the order is paid
        if (order.paymentStatus === 'paid') {
            return res.redirect('/customerPaymentSuccessful');
        }

        // Get all menu items from database
        const menuItems = await Menu.find({});
        
        // Pass order ID and menu items to template
        res.render('customerOrder', { 
            orderId: orderId,
            menuItems: menuItems
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server error');
    }
});

// 添加處理添加到購物車的路由
app.post('/add-to-cart', async (req, res) => {
    try {
        const { orderId, menuItemId, quantity } = req.body;
        
        // 獲取菜單項目詳情
        const menuItem = await Menu.findById(menuItemId);
        if (!menuItem) {
            return res.status(404).send('Menu item not found');
        }

        // 更新訂單，添加新項目
        await Order.findByIdAndUpdate(
            orderId,
            {
                $push: {
                    items: {
                        name: menuItem.name,
                        quantity: quantity,
                        price: menuItem.price,
                        status: 'preparing'
                    }
                }
            }
        );

        // 重定向回訂單頁面
        res.redirect(`/customerOrder?orderId=${orderId}`);
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).send('Error adding item to cart');
    }
});
//----------------------------------------------------------
// Add confirm order route
// Modify confirm order route to append items instead of replacing
app.post('/confirm-order', async (req, res) => {
    try {
        const { orderId, items } = req.body;
        
        // Format new items for the order
        const newOrderItems = items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            status: 'preparing'
        }));

        // Update the order by adding new items to the existing items array
        await Order.findByIdAndUpdate(orderId, {
            $push: { items: { $each: newOrderItems } }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error confirming order:', error);
        res.status(500).json({ success: false, error: 'Error confirming order' });
    }
});
//----------------------------------------------------------

app.get('/customerViewOrder', async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Check if the order is paid
        if (order.paymentStatus === 'paid') {
            return res.redirect('/customerPaymentSuccessful');
        }
        
        res.render('customerViewOrder', { order: order });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server error');
    }
});
//------------------------------------------------------------
app.get('/customerPaymentSuccessful', (req, res) => {
    res.render('customerPaymentSuccessful');
});
// 員工相關路由
app.get('/staffLogin', (req, res) => {
    res.render('staffLogin');
});

app.get('/staffChooseOrderForModification', async (req, res) => {
    try {
        // Fetch all orders from the database
        const orders = await Order.find({})
            .sort({ time: -1 }); // Sort by time in descending order
        
        // Render the view with the orders data
        res.render('staffChooseOrderForModification', { orders: orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Error fetching orders');
    }
});

// Update item status
app.post('/updateItemStatus', async (req, res) => {
    try {
        const { orderId, itemIndex, newStatus } = req.body;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        order.items[itemIndex].status = newStatus;
        await order.save();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating item status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Delete order item
app.post('/deleteOrderItem', async (req, res) => {
    try {
        const { orderId, itemIndex } = req.body;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        order.items.splice(itemIndex, 1);
        await order.save();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// Add new item to order
app.post('/addOrderItem', async (req, res) => {
    try {
        const { orderId, name, quantity, price } = req.body;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        order.items.push({
            name,
            quantity,
            price,
            status: 'preparing'
        });
        await order.save();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

app.get('/staffHistorialOrder', async (req, res) => {
    try {
        // Fetch all orders from the database
        const orders = await Order.find({})
            .sort({ time: -1 }); // Sort by time in descending order
        
        // Render the view with the orders data
        res.render('staffHistorialOrder', { orders: orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Error fetching orders');
    }
});

app.get('/staffOrderModification', async (req, res) => {
    try {
        // Fetch all orders from the database
        const orders = await Order.find({});
        res.render('staffOrderModification', { orders: orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Error fetching orders');
    }
});

app.get('/staffPaymentSystem', async (req, res) => {
    try {
        // Fetch unpaid orders from the database
        const orders = await Order.find({ paymentStatus: 'unpaid' });
        res.render('staffPaymentSystem', { orders: orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Error fetching orders');
    }
});

// Add this route to handle payment status updates
app.post('/updatePaymentStatus', async (req, res) => {
    try {
        const { orderId, paymentStatus } = req.body;
        
        await Order.findByIdAndUpdate(orderId, {
            paymentStatus: paymentStatus
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ success: false, error: 'Error updating payment status' });
    }
});

// 使用路由模組
app.use('/staffRegister', staffRegistrationRoutes);
app.use('/menuManagement', menuManagementRoutes);
app.use('/staff', staffAuthRoutes);

// 端口處理
const normalizePort = (val) => {
    const port = parseInt(val, 10);
    if (isNaN(port)) return val;
    if (port >= 0) return port;
    return false;
};

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

// 啟動服務器
const server = app.listen(port)
    .on('error', (error) => {
        if (error.syscall !== 'listen') throw error;

        const bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // 處理特定的監聽錯誤
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                // 嘗試使用新端口
                console.log('Trying port ' + (port + 1));
                server.listen(port + 1);
                break;
            default:
                throw error;
        }
    })
    .on('listening', () => {
        const addr = server.address();
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        console.log('Server running at http://localhost:' + addr.port);
    });
