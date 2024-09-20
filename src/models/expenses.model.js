const mongoose=require('mongoose')
const expenseSchema=new mongoose.Schema({
     user_id:{type:mongoose.Schema.Types.ObjectId,ref:'Users',required:true},
     category_id:{type:mongoose.Schema.Types.ObjectId,ref:'Category',required:true} ,
     amount:{type:Number,required:true},
     date:{type:Date,required:true},
     description:{type:String},
     created_at:{type:Date,default:Date.now},
     updated_at:{type:Date,default:Date.now}


})

const Expense=mongoose.model('Expense',expenseSchema)

module.exports=Expense;