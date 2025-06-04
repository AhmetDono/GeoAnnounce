const mongoose = require('mongoose');


const bulletinSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true, 
    },
    userName:{
        type:String,
        required:true
    },
    content: { // Duyuru metni
        type: String,
        trim: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],  // [longitude, latitude]
            required: true
        }
    },
    expiresAt: {
    type: Date,
    default: function() {
      // Oluşturulma tarihinden 24 saat sonra
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }
}, { timestamps: true });

bulletinSchema.index({ location: "2dsphere" });

// TTL  (Time to live index) indeksi - belgelerin expiresAt alanına göre otomatik silinmesini sağlar
bulletinSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Bulletin",bulletinSchema);