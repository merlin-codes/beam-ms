const mongoose = require('mongoose');
// let code_raw = Math.random().toString(16).substr(2, 8)
const Lesson = mongoose.Schema(
    {
        name: String,
        teacher: Object,
        students: [...Object]
    }
)

module.exports = mongoose.model('Lessons')