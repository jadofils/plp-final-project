const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/products.model');
const Expense = require('../models/expenses.model');

router.get('/:categoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    console.log('Category ID is:', categoryId);

    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required!' });
    }

    // Validate and convert categoryId to ObjectId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: 'Invalid Category ID!' });
    }

    // Convert categoryId to ObjectId
    const categoryObjectId = new mongoose.Types.ObjectId(categoryId);

    // Perform aggregation concurrently
    const [totalProductPrice, totalExpenseAmount] = await Promise.all([
      Product.aggregate([
        { $match: { category_id: categoryObjectId } }, // Filter by category_id
        { $group: { _id: null, totalPrice: { $sum: '$price' } } }
      ]),
      Expense.aggregate([
        { $match: { category_id: categoryObjectId } }, // Filter by category_id
        { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
      ])
    ]);

    // Extract the total price and total amount from the aggregation results
    const totalProductPriceValue = totalProductPrice.length > 0 ? totalProductPrice[0].totalPrice : 0;
    const totalExpenseAmountValue = totalExpenseAmount.length > 0 ? totalExpenseAmount[0].totalAmount : 0;
    const totalRevenueValue = totalProductPriceValue - totalExpenseAmountValue;

    // Update session data
    req.session.totalProductPrice = totalProductPriceValue;
    req.session.totalExpenseAmount = totalExpenseAmountValue;
    req.session.totalRevenue = totalRevenueValue;

    // Respond with updated data
    res.json({
      totalProductPrice: req.session.totalProductPrice,
      totalExpenseAmount: req.session.totalExpenseAmount,
      totalRevenue: req.session.totalRevenue
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
