const mongoose = require('mongoose');
// let code_raw = Math.random().toString(16).substr(2, 8)
const LessonSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        time: [
            {
                day: String,
                time: Number,
            },
        ],
        clas: Object,
        teacher: Object,
        students: Array
    }
)

module.exports = mongoose.model('Lessons',LessonSchema)