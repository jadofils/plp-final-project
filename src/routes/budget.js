const express = require('express');
const router = express.Router();
const Budget=require('../models/budget.model')
const morgan = require('morgan');

router.use(morgan('dev'));

// POST route to handle the submission of the budget form
router.post('/:categoryId', async (req, res) => {
      try {
          // Check if user is logged in
          if (!req.session.user) {
              return res.redirect('/login'); // Redirect to login if not logged in
          }
  
          const userId = req.session.user._id;
          const categoryId = req.params.categoryId;
          const { amount, startDate, endDate } = req.body;
  
          // Validate inputs (optional but recommended)
          if (!amount || !startDate || !endDate) {
              return res.status(400).json({ message: 'All fields are required' });
          }
  
          // Create a new budget document
          const newBudget = new Budget({
              user_id: userId,
              category_id: categoryId,
              amount,
              start_date: new Date(startDate),
              end_date: new Date(endDate),
          });
  
          // Save the budget to the database
          await newBudget.save();
  
          // Send a success response
          res.status(200).json({ message: 'Budget added successfully!' });
      } catch (error) {
          console.error('Error adding budget:', error);
          // Send an error response
          res.status(500).json({ message: 'Internal Server Error' });
      }
  });
  
  // Route to handle budget update
router.put('/:budgetId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized' }); // Not logged in
        }

        const userId = req.session.user._id;
        const budgetId = req.params.budgetId;
        const { amount, startDate, endDate } = req.body;

        // Find and update the budget
        const budget = await Budget.findOneAndUpdate(
            { _id: budgetId, user_id: userId }, // Ensure the user is allowed to update this budget
            { amount, start_date: startDate, end_date: endDate },
            { new: true } // Return the updated document
        );

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        res.json({ message: 'Budget updated successfully', budget });
    } catch (error) {
        console.error('Error updating budget:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
// Route to handle budget deletion
router.delete('/:budgetId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized' }); // Not logged in
        }

        const userId = req.session.user._id;
        const budgetId = req.params.budgetId;

        // Find and delete the budget
        const budget = await Budget.findOneAndDelete({
            _id: budgetId,
            user_id: userId // Ensure the user is allowed to delete this budget
        });

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
module.exports=router