import { v2 as cloudinary } from 'cloudinary';
import fs from "fs" //fs -> file system -- included in NodeJS

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload 
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        console.log("File has been uploaded successfully on Cloudinary", response);
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // File is removed from server(Unlink)
        return { error: "File not Uploaded" }
    }
}


export { uploadOnCloudinary }
