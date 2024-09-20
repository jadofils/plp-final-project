const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const PaymentMethod = require('../models/payment.model');
const morgan = require('morgan');

router.use(morgan('dev'));

// Handle POST request for creating a payment method
router.post('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { payment_method_name } = req.body;

    if (!userId || !payment_method_name) {
        return res.status(400).json({ message: 'User ID and Payment Method Name are required' });
    }

    try {
        const newPaymentMethod = new PaymentMethod({
            user_id: userId,
            payment_method_name: payment_method_name
        });

        await newPaymentMethod.save();
        res.status(201).json({ message: 'Payment Method Created Successfully' });
    } catch (error) {
        console.error('Failed to create a new payment method', error);
        res.status(500).json({ message: 'Failed to create a new payment method' });
    }
});
  

// Update payment method
router.put('/:id', async (req, res) => {
    const paymentId = req.params.id;
    const { payment_method_name, amount } = req.body;
  
    try {
        const updatedPayment = await PaymentMethod.findByIdAndUpdate(paymentId, {
            payment_method_name,
            amount
        }, { new: true });
  
        if (!updatedPayment) {
            return res.status(404).json({ message: 'Payment method not found' });
        }
  
        res.json(updatedPayment);
    } catch (error) {
        console.error('Failed to update payment method', error);
        res.status(500).json({ message: 'Server error while updating payment method' });
    }
  });
  
// DELETE route to remove a payment
router.delete('/:id', async (req, res) => {
    const paymentId = req.params.id;

    try {
        const payment = await PaymentMethod.findByIdAndDelete(paymentId);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.status(200).json({ message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('Failed to delete payment', error);
        res.status(500).json({ message: 'Server error while deleting payment' });
    }
});
module.exports = router;
