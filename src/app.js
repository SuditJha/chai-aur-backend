import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
// Initializing the app
const app = express()

// Set up for cors - Cross Origin Resource Sharing
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
// Using middleware to setup config for incoming JSON data
app.use(express.json({
    limit: "16kb",
}))

// Config for incoming data from url, forms, etc
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

// Config to serve static files
app.use(express.static("public"))

// Config for Cookie Parser 
app.use(cookieParser())

// Routes import
import userRouter from "./routes/users.route.js"


// routes Declaration

app.use("/api/v1/users", userRouter)
// http//{baseurl}/api/v1/users/{register}

export default app