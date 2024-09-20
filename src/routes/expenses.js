const express = require('express');
const router = express.Router();
const Category = require('../models/categories.model');
const User = require('../models/user.model');
const Expense=require('../models/expenses.model')
const morgan=require('morgan')

router.use(morgan('dev'))

router.post('/:userId/:categoryId', async(req,res)=>{
      try {
            const  {userId,categoryId}=req.params
            const {amount,description}=req.body
            if(!userId || !categoryId ){
                  return res.status(404).json({message:'The userId and Category Id can not be empty'})

            }
            if(!amount || !description ){
                  return res.status(404).json({message:'The userId and Category Id can not be empty'})

            }

            const userExist=await User.findById(userId)
            if(!userExist){
                  return res.status(400).json({message:'User Not Exist!!'})
            }
            const categoryExist=await Category.findById(categoryId)
            if(!categoryExist){
                  return res.status(400).json({message:`Category on user ${userId} and ${categoryId} Are not Exist In Expense table`})
            }
           const createExpense=await Expense.create({
            user_id:userId,
            category_id:categoryId,
            amount:amount,
            date:Date.now(),
            description:description
           })
           if(createExpense.length===0){
             return res.status(400).json({message:'Expense does not created'})
           }
           return res.status(201).json({message:'Expense have created succesSFULLY!!'})
            
      } catch (error) {
         console.error('Failed to Insert Expenses Method',error)
         return res.status(500).json({message:'Failed due to Internal server error',message:message})   
      }
})


router.put('/:user_id/:category_id/:_id', async (req, res) => {
      try {
          const { user_id, category_id, _id } = req.params;
          const { amount, description } = req.body;
  
          // Check if user_id and category_id are provided
          if (!user_id || !category_id) {
              return res.status(400).json({ message: 'The userId and Category Id cannot be empty' });
          }
  
          // Check if amount and description are provided
          if (!amount || !description) {
              return res.status(400).json({ message: 'Amount and Description cannot be empty' });
          }
  
          // Check if user exists
          const userExist = await User.findById(user_id);
          if (!userExist) {
              return res.status(400).json({ message: 'User Not Exist!!' });
          }
  
          // Check if category exists
          const categoryExist = await Category.findById(category_id);
          if (!categoryExist) {
              return res.status(400).json({ message: `Category with ID ${category_id} does not exist!` });
          }
  
          // Update the expense
          const updateExpense = await Expense.findOneAndUpdate(
              { _id: _id, user_id: user_id, category_id: category_id },
              { amount, description },
              { new: true }
          );
  
          if (!updateExpense) {
              return res.status(400).json({ message: 'Expense could not be updated' });
          }
  
          return res.status(200).json({ message: 'Expense updated successfully!' });
  
      } catch (error) {
          console.error('Failed to Update Expense Method', error);
          return res.status(500).json({ message: 'Failed due to Internal server error' });
      }
  });
  
// Express.js route example
router.delete('/:userId/:expenseId', async (req, res) => {
      const { userId, expenseId } = req.params;
      try {
          // Implement your delete logic here, e.g., using Mongoose to delete the expense from MongoDB
          await Expense.deleteOne({ _id: expenseId, user_id: userId });
          res.status(200).json({ message: 'Expense deleted successfully' });
      } catch (error) {
          res.status(500).json({ message: 'Error deleting expense', error });
      }
  });
  
module.exports=router