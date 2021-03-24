const mongoose = require('mongoose');

const User = mongoose.Schema(
    {
        name: String,
        email: String,
        role: Number,
        registred: Date.now,
        class: Object,
        log: Object
    }
)

module.exports = mongoose.model('Users')