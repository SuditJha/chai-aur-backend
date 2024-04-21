// Environment Variables
// require('dotenv').config({path: "./env"})
// Improved .env Adding experimental feature to package.json script file > script tag
import dotenv from "dotenv"
import mongoose from "mongoose";
import connectDB from "./db/index.js";
import app from "./app.js";


connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("Error : ", error);
            throw error
        })
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port : ${process.env.PORT}`);
        })
    })
    .catch((error) => {
        console.log("MongoDB Connection with app Failed : ", error);
    })
