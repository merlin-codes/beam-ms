const mongoose = require('mongoose');

const Answer = mongoose.Schema(
    {
        author: Object,
        template: Object,
        mark: Number
    }
)

module.exports = mongoose.model('Answers')