import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = (async (req, res) => {

console.log("FILES RECEIVED:", req.files);

    const { fullName, email, userName, password } = req.body
    console.log("email:", email)

    if (
        [fullName, email,userName,password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }


    const existedUser= await User.findOne({
        $or: [{ email }, { userName }]
    })
    if(existedUser){
        throw new ApiError(409, "Email or username already exists")
    }
    // console.log( req.files);
    const avatarLocalPath=req.files?.avatar[0]?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar and cover image are required")
    }
    const avatar = await uploadToCloudinary(avatarLocalPath, "avatars")
    if(!avatar){    
    throw new ApiError(500, "Failed to upload avatar")
    }
    
    let coverImage = null; // Default to null
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    if (coverImageLocalPath) {
        coverImage = await uploadToCloudinary(coverImageLocalPath, "coverImages");
        // No need to throw error if cover image fails, as it's optional
        if (!coverImage) {
            console.error("Cover image upload failed but proceeding without it.");
        }
    }
    // const coverImageLocalPath=req.files?.coverImage[0]?.path


    // const coverImage = await uploadToCloudinary(coverImageLocalPath, "coverImages")
    

    const user =await User.create({
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
        


