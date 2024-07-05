import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js";

const options = {
    httpOnly: true,
    secure: true,
}

const registerUser = asyncHandler(async (req, res) => {

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

const generateAccessAndRefreshTokens = async (userId) => {
    console.log("userId", userId);
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const loginUser = asyncHandler(async (req, res) => {
    const { email, phone, password } = req.body;

    if (password == "" && (email == "" || phone == "")) {
        throw new ApiError(400, "All fields are required!")
    }

    const user = await User.findOne({
        $or: [{ phone }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User with this email or username is not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Password is not correct")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
                "User logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    console.log("user =====>", req.user);
    await User.findByIdAndUpdate(req.user._id, {
        $set: { refreshToken: undefined }
    },
        { new: true }
    )

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logout successfully"))
})



export { registerUser, loginUser, logoutUser }