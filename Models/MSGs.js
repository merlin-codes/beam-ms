const mongoose = require('mongoose');

const MSG = mongoose.Schema(
    {
        author: Object,
        content: String,
    }, { timestamps: true }
)

module.exports = mongoose.model('MSGs', MSG)
