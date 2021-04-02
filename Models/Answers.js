const mongoose = require('mongoose');

const Answer = mongoose.Schema(
    {
        author: Object,
        template: Object,
        test: Boolean,
        answer_id: Object,
        mark: Number 
    }
)

module.exports = mongoose.model('Answers', Answer)