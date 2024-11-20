const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  seat: String,
  numberOfPeople: Number,
  time: { type: Date},
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  items: [
    {
      name: String,
      quantity: Number,
      price: Number,
      status: { type: String, enum: ['preparing', 'delivering', 'completed'], default: 'preparing' }
    }
  ]
});

module.exports = mongoose.model('Order', orderSchema);
