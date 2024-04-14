// Environment Variables
// require('dotenv').config({path: "./env"})
// Improved .env Adding experimental feature to package.json script file > script tag
import dotenv from "dotenv"
import mongoose from "mongoose";
import connectDB from "./db/index.js";

connectDB()
