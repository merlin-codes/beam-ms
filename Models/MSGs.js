const mongoose = require('mongoose');

const MSG = mongoose.Schema(
    {
        author: Object,
        content: String,
    }
)

module.exports = mongoose.model('MSGs')