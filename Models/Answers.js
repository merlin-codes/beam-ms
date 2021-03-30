const mongoose = require('mongoose');

const Answer = mongoose.Schema(
    {
        author: {
            type: Object,
            required: true
        },
        template: {
            type: Object,
            require: true
        },
        mark: {
            type: Number,
            required: false
        }
    }
)

module.exports = mongoose.model('Answers')