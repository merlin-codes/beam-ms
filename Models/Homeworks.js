const mongoose = require('mongoose');

const Homework = mongoose.Schema(
    {
        name: String,
        lesson: Object,
        author: Object,
        template: Object
    }
)

module.exports = mongoose.model('Homeworks')