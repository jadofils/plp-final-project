const express = require('express');
const router = express.Router();
const Category = require('../models/categories.model');
const User = require('../models/user.model');
const morgan=require('morgan')

router.use(morgan('dev'))


router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category_name,description } = req.body;  // Use `category_name` here

    console.log('Request body:', req.body); 

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required!' });
    }

    if (!category_name  || !description) {  // Use `category_name` here
      return res.status(400).json({ message: 'Category Name or Description is required!' });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found!' });
    }

    const category = await Category.create({
      user_id: userId,
      category_name: category_name , // Use `category_name` here,
      description:description
    });

    res.status(200).json({ category });
  } catch (error) {
    console.error('Error on Category:', error);
    return res.status(500).json({ message: 'Internal server error or an error occurred while processing your request.' });
  }
});


    router.get('/', async (req, res) => {
      try {
          const userId = req.session.user._id; // Fetch the logged-in user's ID from the session
          console.log(userId)
          const categories = await Category.find({ user_id: userId }); // Find categories specific to the user
          
          if (categories.length > 0) {
              return res.status(200).json({ categories: categories });
          } else {
              return res.status(404).json({ message: 'No categories found for this user' });
          }
      } catch (error) {
          return res.status(500).json({ message: 'Internal Server Error' });
      }
  });
  
  router.put('/:categoryId/:userId', async (req, res) => {
    const { categoryId, userId } = req.params;
    const { category_name, description } = req.body;
console.log(category_name, description )
    try {
        // Find and update the category
        const updatedCategory = await Category.findOneAndUpdate(
            { _id: categoryId, user_id: userId },
            { category_name, description },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found for this user.' });
        }

        // Respond with updated category
        res.json({ message: 'Category updated successfully!', category: updatedCategory });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Error updating category.' });
    }
});

router.delete('/:userId/:categoryId', async (req, res) => {
  const { categoryId, userId } = req.params;

  try {
    // Validate input
    if (!userId || !categoryId) {
      return res.status(400).json({ message: 'User ID and Category ID are required!' });
    }

    // Check if the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Find and delete the category
    const deleteCategory = await Category.findOneAndDelete({
      _id: categoryId,
      user_id: userId,
    });

    // Check if the category was deleted
    if (!deleteCategory) {
      return res.status(404).json({ message: 'Category not found or does not belong to this user.' });
    }

    res.status(200).json({ message: 'Deleted successfully', category: deleteCategory });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ message: 'Error deleting category.' });
  }
});

router.get('/chart-data', async (req, res) => {
  try {
      console.log('User ID from session:', req.session.user._id);

      const data = await Category.aggregate([
          { $match: { user_id: req.session.user._id } },
          {
              $group: {
                  _id: '$category_name',
                  revenue: { $sum: '$price' },
                  profit: { $sum: '$price' },
                  freeCashFlow: { $sum: '$price' }
              }
          }
      ]);

      console.log('Aggregated Data:', data);

      const formattedData = {
          categories: data.map(item => item._id),
          revenue: data.map(item => item.revenue),
          profit: data.map(item => item.profit),
          freeCashFlow: data.map(item => item.freeCashFlow)
      };

      res.json(formattedData);
  } catch (error) {
      console.error('Server Error:', error);
      res.status(500).send('Server Error');
  }
});

module.exports = router;
