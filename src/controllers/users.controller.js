import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.service.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

// Access And refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        // console.log(user)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        // await user.save()
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }

    } catch (error) {
        console.log("Error: --> ", error)
        throw new ApiError(400, "Something went wrong while generating access and refresh tokens", error)
    }
}

const registerUser = asyncHandler(async (req, res) => {

    // Take all data from frontend.
    // Validate all fields are present or not (Not Empty)
    // CHeck if User already exists (Check for both userName, & Email)
    // Check if (Files) images are uploaded or not // Check if avatar is uploaded or not
    // Upload them on cloudinary
    // Check if images are uploaded on cloudinary, check for avatar
    // create user Object -> Create entry in db
    // remove refreshToken and password from response.
    //  Check if user is created or not
    // return response.

    const { fullName, username, email, password } = req.body
    console.log("email", email)

    // Either validate one by one using if()
    // if (fullName === "") {
    //     throw new ApiError(400, "Full Name is required!!")
    // }

    // Validating all fields at once

    if (
        [fullName, email, username, password].some((field) => {
            field.trim() === ""
        })
    ) {
        throw new ApiError(400, "All fields are required!!")
    }



    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists.")
    }

    // Getting File from Multer
    const avatarLocalFilePath = req.files?.avatar[0]?.path
    console.log("Avatar local path ", avatarLocalFilePath)

    if (!avatarLocalFilePath) {
        throw new ApiError(400, "Avatar file is required!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalFilePath)


    let coverImage = ""
    if (Array.isArray(req.files?.coverImage)) {
        const coverImageLocalFilePath = req.files?.coverImage[0]?.path
        coverImage = await uploadOnCloudinary(coverImageLocalFilePath)
    }

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required!!")
    }

    const user = await User.create({
        fullName,
        email,
        password,
        avatar: avatar?.url || "",
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
    })

    if (user.avatar === "") {
        throw new ApiError(500, "avatar file url was not saved in Database")
    }

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Opps! SOmething went wrong while registering.")
    }

    // Console logs
    // console.log("Files from multer", req.files);

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    // req.body -> data
    // login via username || email
    // Find the user
    // Check password
    // Generate access and refresh token
    // send the tokens to user using secure cookies

    const { username, email, password } = req.body
    if (!(username || email)) {
        throw new ApiError(401, "Username or Email is required !!")
    }
    // console.log(email);
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user not found ")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid password")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const cookieOptions = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    // console.log(user);

    const cookieOptions = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(200, {}, "User successfully logged out")
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }
    try {

        const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id)

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh Token Invalid or Expired")
        }

        const cookieOptions = {
            httpOnly: true,
            secure: true
        }
        // Generating new Access and refresh Token
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res.status(200)
            .cookie("accessToken", accessToken)
            .cookie("refreshToken", refreshToken)
            .json(
                new ApiResponse(200, { user, accessToken, refreshToken }, "New Access Token and Refresh Token Generated Successfully")
            )

    } catch (error) {
        throw new ApiError(400, error.message || "Invalid Token or Error while creating new Refresh Token")

    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
        throw new ApiError(401, "All fields are required")
    }

    console.log(req.user._id);


    const user = await User.findById(req.user?._id)
    // console.log(user)
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid current Password")
    }

    if (oldPassword === newPassword) {
        throw new ApiError(400, "Your current and new Password should be different")
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "New Password and Confirm Password must be same")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200)
        .json(
            new ApiResponse(200, {}, "Your Password was changed successfully")
        )

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(new ApiResponse(200, req.user, "Current User fetched Successfully"))
})

const updateUserAccountDetails = asyncHandler(async (req, res) => {
    const { username, fullName, email } = req.body
    if (!username || !fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req?.user?._id,
        {
            $set: {
                username,
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res.status(200)
        .json(new ApiResponse(200, user, "User account details updated successfully"))

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalFilePath = req.file?.path
    console.log(avatarLocalFilePath);
    if (!avatarLocalFilePath) {
        throw new ApiError(400, "Avatar file is missing!")
    }

    const dbAvatarUrlToBeDeletedFromCloudinary = req?.user?.avatar
    //TODO: Delete the old Avatar file uploaded on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalFilePath)

    if (!avatar?.url) {
        throw new ApiError(500, "Error while uploading avatar on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req?.user?._id,
        {
            $set: {
                avatar: avatar?.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    res.status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Avatar Updated successfully"
            )
        )

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalFilePath = req.file?.path

    if (!coverImageLocalFilePath) {
        throw new ApiError(400, "Cover Image file is missing!")
    }

    const dbcoverImageUrlToBeDeletedOnCloudinary = req.user?.coverImage
    //TODO: Delete the old cover image file uploaded on cloudinary

    const coverImage = await uploadOnCloudinary(coverImageLocalFilePath)
    if (!coverImage?.url) {
        throw new ApiError(500, "Error while uploading cover image on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req?.user?._id,
        {
            $set: {
                coverImage: coverImage?.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    res.status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Cover Image Updated successfully"
            )
        )

})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
}

