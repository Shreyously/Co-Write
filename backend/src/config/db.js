import mongoose from 'mongoose';

const connectToDb = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cowrite';

    try {
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export default connectToDb;