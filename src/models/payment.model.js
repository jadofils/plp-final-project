const mongoose=require('mongoose')
const paymentMethodSchema=mongoose.Schema({
      user_id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Users',
            required:true
      },

      payment_method_name:{type:String,required:true},
      createdAt: { type: Date, default: Date.now },
      update_at:{type:Date,default:Date.now}

})

const paymentMethod=mongoose.model('PaymentMethod',paymentMethodSchema)

module.exports=paymentMethod;