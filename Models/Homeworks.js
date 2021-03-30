const mongoose = require('mongoose');

const Homework = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        lesson: Object,
        author: Object,
        template: Object
    }
)

module.exports = mongoose.model('Homeworks')