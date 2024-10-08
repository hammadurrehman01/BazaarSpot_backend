import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js";
import bcyrpt from "bcrypt";

const options = {
    httpOnly: true,
    secure: true,
}

const registerUser = asyncHandler(async (req, res) => {
    
    try {
        const { name, email, phone, password } = req.body;

        if (name == "" && (email == "" || phone == "") && password == "") {
            throw new ApiError(400, "All fields are required!")
        }

        if (email) {
            const existedUserWithEmail = await User.findOne({ email });
            if (existedUserWithEmail) {
                // throw new ApiError(409, "User with this email already exists");
                return res.status(400).json({
                    isError: true,
                    message: "User with this email already exists"
                })
            }
            return
        }

        if (phone) {
            const existedUserWithPhone = await User.findOne({ phone });
            if (existedUserWithPhone) {
                throw new ApiError(409, "User with this phone already exists");
            }
        }

        const userDetails = await User.create({
            name,
            email: email || undefined,
            phone: phone || undefined,
            password,
        });

        const createdUser = await User.findById(userDetails._id).select("-password -refreshToken");

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering a user")
        }

        return res.status(201).send(
            new ApiResponse(200, "User registered successfully", createdUser)
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong")

    }


});

const addToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const token = user.generateToken();

        user.token = token;
        user.save({ validateBeforeSave: false });

        return { token }

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong")
    }
}

const loginUser = asyncHandler(async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        if (!((phone || email) && password)) {
            throw new ApiError(400, "username or password must required")
        }
        let user;
        if (email) {
            const existedUserWithEmail = await User.findOne({ email });
            if (existedUserWithEmail) {
                user = existedUserWithEmail
            }
        }

        if (phone) {
            const existedUserWithPhone = await User.findOne({ phone });
            if (existedUserWithPhone) {
                user = existedUserWithPhone
            }
        }

        if (!user) {
            throw new ApiError(404, "User with this email or username is not exist")
        }

        const isPasswordValid = await user?.isPasswordCorrect(password, user.password)

        if (!isPasswordValid) {
            throw new ApiError(401, "Password is not correct")
        }

        const { token } = await addToken(user._id);

        const loggedInUser = await User.findById(user._id).select("-password -token -createdAt -updatedAt -name");

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
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong")
    }

})

const logoutUser = asyncHandler(async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            $set: { refreshToken: undefined }
        },
            { new: true }
        )

        return res.status(200)
            .clearCookie("token", options)
            .json(new ApiResponse(200, {}, "User logout successfully"))
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong")
    }

})

const getCurrentUser = asyncHandler(async (req, res) => {
    try {
        const id = req.user._conditions._id

        const user = await User.findOne({ _id: id }).select("-password -createdAt -updatedAt")

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
                "Current User is fetched successfully",
                user,
            ))

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong")
    }
})

const updateUserDetails = asyncHandler(async (req, res) => {
    try {
        // const { name, email, phone } = req.body;
        const { name } = req.body;
        const id = req.user._conditions._id

        // if (!name) (!name && !email && !phone){
        //     throw new ApiError(400, "All fields are required")
        // }
        if (!name) {
            throw new ApiError(400, "All fields are required")
        }

        const updatedUser = await User.findByIdAndUpdate(id, {
            $set: {
                name,
            }
            // $set: {
            //     name,
            //     email,
            //     phone,
            // }
        },
            { new: true }
        ).select("-password")

        return res.status(200)
            .json(new ApiResponse(200, updatedUser, "User details has been updated"))

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong")

    }
})


// Forgot password handle to check user with provided email or phone to authenticate user
const forgotPassword = asyncHandler(async (req, res) => {
    try {
        const { email, phone } = req.body;

        // Ensure at least one of email or phone is provided
        if (!email && !phone) {
            throw new ApiError(400, "Either email or phone number is required");
        }

        let user;

        // Search by email if provided
        if (email) {
            user = await User.findOne({ email }).select("-password -createdAt -updatedAt");
        }

        // If user not found by email, search by phone
        if (!user && phone) {
            user = await User.findOne({ phone }).select("-password -createdAt -updatedAt");
        }

        // If no user is found by either method
        if (!user) {
            throw new ApiError(404, "User not found with the provided email or phone number");
        }

        // If user is found, return success
        return res.status(200).json(new ApiResponse(200, "User has been fetched", user));
    } catch (error) {
        return res.status(500).json(new ApiError(500, error?.message || "Something went wrong"));
    }
})

const resetPassword = asyncHandler(async (req, res) => {
    try {

        const { password, confirmPassword } = req.body;
        
        const id = req.user._conditions._id


        if (!password && !confirmPassword) {
            throw new ApiError(404, "All fields are required")
        }

        if (password !== confirmPassword) {
            throw new ApiError(404, "Passwords are not matched")

        }
        // console.log("User Upper--->",User.call());
        const user = await User.findById(_id);
        console.log('user-->',user);

        if (!user) {
            throw new ApiError(400, "User not found")
        }

        const correctpassword = await user.isPasswordCorrect(oldPassword);

        if (!correctpassword) {
            throw new ApiError(404, "Old Password is not correct");
        }

        user.password = newPassword;


        await user.save({ validateBeforeSave: true });

        return res.status(200)
            .json(
                new ApiResponse(200, {}, "Password has been changed successfully!")
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong")

    }
})

const forgettenResetPassword = asyncHandler(async (req, res) => {
    try {
        const { password, confirmPassword,userId } = req.body;
        // const { userId } = req.params;
        console.log('userId-->',userId);

        if (!password && !confirmPassword) {
            throw new ApiError(400, "All fields are required");
        }

        if (password !== confirmPassword) {
            throw new ApiError(400, "Passwords do not match");
        }

        const user = await User.findById(userId);  
        console.log("user-->",user);  

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        user.password = password;
        await user.save({ validateBeforeSave: true });

        return res.status(200).json(
            new ApiResponse(200, {}, "Password has been changed successfully!")
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong");
    }
});

export { registerUser, loginUser, logoutUser, getCurrentUser, updateUserDetails, forgotPassword, resetPassword,forgettenResetPassword }