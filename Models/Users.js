const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
    {
        name: String,
        email: String,
        role: Number,
        registred: Date,
        class: Object,
        pwd: String,
    }, { timestamps: true }
);

module.exports = mongoose.model('User', userSchema)
