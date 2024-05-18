import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.service.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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

    const coverImageLocalFilePath = req.files?.coverImage[0]?.path
    let coverImage = ""
    if (coverImageLocalFilePath) {
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

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Opps! SOmething went wrong while registering.")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})


export { registerUser }

