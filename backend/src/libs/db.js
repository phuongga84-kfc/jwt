import mongoose from 'mongoose'

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("Successfully connected to the database!")
    }
    catch(error) {
        console.log("error connecting to the database")
        console.error(error)
        process.exit(1)
    }
}