const mongoose = require('mongoose');

// Refresh Token Model
const RefreshTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    token: String,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('RefreshToken', RefreshTokenSchema);