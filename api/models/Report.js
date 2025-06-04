const mongoose = require('mongoose');

const reportSchema = mongoose.Schema({
    message:{
        type:String,
        required:true,
        trim:true
    },
    bulletinId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bulletin',
        required:true, 
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true, 
    }
},{ timestamps: true });


module.exports = mongoose.model("Report",reportSchema);