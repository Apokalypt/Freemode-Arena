const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema(
    {
        thread: {
            required: true,
            type: String,
            default: null
        },
        id: {
            required: true,
            type: String,
            default: null
        }
    },
    {
        methods: { },
        query: { },
        statics: { }
    }
);

ParticipantSchema.index({ id: 1 }, { unique: true });

const Participant = mongoose.model('Participant', ParticipantSchema);

module.exports = Participant;
