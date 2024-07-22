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

const addToken = async (userId) => {

    try {
        const user = await User.findById(userId);
        const token = user.generateToken();

        user.token = token;
        user.save({ validateBeforeSave: false });

        return { token }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating token")
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

    const { token } = await addToken(user._id);


    console.log(user.password);

    const loggedInUser = await User.findById(user._id).select("-password -token");



    return res
        .status(200)
        .cookie("token", token, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                token,
            },
                "User logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: { refreshToken: undefined }
    },
        { new: true }
    )

    return res.status(200)
        .clearCookie("token", options)
        .json(new ApiResponse(200, {}, "User logout successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const token = req.cookies.token;
    req.user;

    if (!token) {
        return res.status(401)
            .json(new ApiResponse(
                401,
                "Unauthorized request"
            ))
    }

    const user = await User.findOne({ token })

    if (!user) {
        return res.status(404)
            .json(new ApiResponse(
                404,
                "User not found"
            ))
    }

    return res.status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "Current User is fetched successfully"
        ))
})

const getAllUsers = asyncHandler(async (req, res) => {
    const allUsers = await User.find();
    return res.status(200)
        .json(new ApiResponse(
            200,
            allUsers,
            "All Users are fetched successfully"
        ))
})

const updateUserDetails = asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body;
    const id = req.user._conditions._id

    if (!name && !email && !phone) {
        throw new ApiError(400, "All fields are required")
    }

    const updatedUser = await User.findByIdAndUpdate(id, {
        $set: {
            name,
            email,
            phone,
        }
    },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(new ApiResponse(200, updatedUser, "User details has been updated"))
})

const forgotPassword = asyncHandler(async (req, res) => {
    const { email, phone } = req.body;

    if (!email && !phone) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findOne({ $or: [{ email }, { phone }] });

    if (!user) {
        throw new ApiError(400, "User not found")
    }

    return res.status(200)
        .json(new ApiResponse(200, user, "User has been fetched"))
})

const resetPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const id = req.user._conditions._id

    if (!oldPassword && !newPassword && !confirmNewPassword) {
        throw new ApiError(404, "All fields are required")
    }

    if (newPassword !== confirmNewPassword) {
        throw new ApiError(404, "Passwords are not matched")

    }

    const user = await User.findById(id);

    if (!user) {
        throw new ApiError(400, "User not found")
    }

    const correctpassword = await user.isPasswordCorrect(oldPassword);

    if (!correctpassword) {
        throw new ApiError(404, "password is not correct");
    }

    user.password = newPassword;

    
    await user.save({ validateBeforeSave: true });
    
    console.log(user.password);
    return res.status(200)
        .json(
            new ApiResponse(200, {}, "Password has been changed successfully!")
        )
})




export { registerUser, loginUser, logoutUser, getCurrentUser, getAllUsers, updateUserDetails, forgotPassword, resetPassword }