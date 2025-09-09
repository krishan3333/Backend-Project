import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = (async (req, res) => {



   const {fullName, email,userName,password}= req.body
    console.log("email:", email)

    if (
        [fullName, email,userName,password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }


    const existedUser= User.findOne({
        $or: [{ email }, { userName }]
    })
    if(existedUser){
        throw new ApiError(409, "Email or username already exists")
    }
    const avatarLocalPath=req.files?.avatar[0]?.path
    const coverImageLocalPath=req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar and cover image are required")
    }

    const avatar = await uploadToCloudinary(avatarLocalPath, "avatars")
    const coverImage = await uploadToCloudinary(coverImageLocalPath, "coverImages")

    if(!avatar){    
    throw new ApiError(400, "Failed to upload avatar")
    }

    await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select("-password -refreshTokens")

    if(!createdUser){
        throw new ApiError(500, "Failed to create user")
    }

    return res.status(201).json(new ApiResponse(200, "User registered successfully", createdUser))

})

export { registerUser }
        


