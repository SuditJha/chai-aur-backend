import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.service.js"
import { ApiResponse } from "../utils/ApiResponse.js"

// Access And refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        user.refreshToken = refreshToken
        // await user.save()
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(400, "Something went wrong while generating access and refresh tokens")
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
        avatar: avatar?.secure_url || "",
        coverImage: coverImage?.secure_url || "",
        username: username.toLowerCase(),
    })

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

export {
    registerUser,
    loginUser,
    logoutUser
}

