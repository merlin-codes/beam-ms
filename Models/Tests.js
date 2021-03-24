const mongoose = require('mongoose');

const Test = mongoose.Schema(
    {
        name: String,
        lesson: Object,
        author: Object,
        template: Object
    }
)

module.exports = mongoose.model('Tests')