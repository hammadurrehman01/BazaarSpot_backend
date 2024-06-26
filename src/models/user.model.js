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
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: Numbersss,
        required: true,
        unique: true,
        trim: true,
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

userSchema.pre("save", async (next) => {
    if (!this.isModified("password")) return next()

    this.password = await bcyrpt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect = async (password) => {
    return await bcyrpt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = () => {
    return jwt.sign({
        _id: this._id,
        name: this.name,
        email: this.email,
        phone: this.phone,
    }, process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateAccessToken = () => {
    return jwt.sign({
        _id: this._id,
    }, process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema)