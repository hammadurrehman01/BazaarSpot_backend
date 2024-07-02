import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError"
import { ApiResponse } from "../utils/ApiResponse"
import { User } from "../models/user.model";

const options = {
    httpOnly: true,
    secure: true,
}

export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (name == "" && email == "" && phone == "" && password == "") {
        throw new ApiError(400, "All fields are required!")
    }

    const existedUser = await User.findOne({
        $or: [{ phone }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with phone or email already exists")
    }

    const userDetails = await User.create({
        name,
        email,
        phone,
        password,
    });

    const createdUser = await User.findById(userDetails._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering a user")
    }

    return res.status(201).send(
        new ApiResponse(200, "User registered successfully", createdUser)
    )
});