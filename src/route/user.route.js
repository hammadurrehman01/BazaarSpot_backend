import Router from "express";
import { forgotPassword, getAllUsers, getCurrentUser, loginUser, logoutUser, registerUser, resetPassword, updateUserDetails } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(registerUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);
userRouter.route("/all-users").get(verifyJWT, getAllUsers);
userRouter.route("/update-user").put(verifyJWT, updateUserDetails);
userRouter.route("/forgot-password").post(verifyJWT, forgotPassword);
userRouter.route("/reset-password").post(verifyJWT, resetPassword);

export default userRouter;
