const mongoose = require('mongoose');

const Test = mongoose.Schema(
    {
        name: String,
        lesson: Object,
        author: Object,
        timout: Number,
        date: Object,
        template: Object,
        avg: Number
    }
)

module.exports = mongoose.model('Tests', Test)