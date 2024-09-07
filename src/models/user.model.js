import mongoose, { Schema } from "mongoose";
import bcyrpt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        sparse: true
    },
    phone: {
        type: Number,
        unique: true,
        trim: true,
        sparse: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    refreshToken: {
        type: String,
    },
},
    { timestamps: true }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()

    this.password = await bcyrpt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcyrpt.compare(password, this.password)
}

userSchema.methods.generateToken = function () {
    return jwt.sign({
        _id: this._id,
        name: this.name,
        email: this.email,
        phone: this.phone,
    }, process.env.JWT_SECRET_KEY,
        {
            expiresIn: process.env.JWT_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema)