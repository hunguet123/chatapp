const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
mongoose.plugin(slug);
const { Schema } = mongoose;

const UserSchema = new Schema(
    {
        username: { type: String, default: undefined },
        given_name: { type: String, default: null },
        family_name: { type: String, default: null },
        email: { type: String, default: null, unique: true },
        phone: { type: String, default: null },
        picture: { 
            name: {type: String, default: null,},
            image_url: {type: Boolean, default: true},
        },
        role: {type: String, default: undefined},
        gender: {type: String, default: null},
        address: {type: String, default: null},
        theme: {type: String, default: null},
        saved_posts: [
            {type: mongoose.ObjectId, default: undefined},
        ],
        slug: { type: String, slug: 'email', unique: true },
    },
    {
        timestamps: true,
    },
)

// Export a model
// Modal name = Collection name (in plural & lowercase form)
module.exports = mongoose.model('user', UserSchema)