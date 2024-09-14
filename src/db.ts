import mongoose, { Schema, Document, Model } from 'mongoose';
import { mongodb } from './config.json';
import logger from './utils/logger'



const uri: string = mongodb.url;

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(uri);
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
    }
};

// Define the interface for the document
interface IUserData extends Document {
    discordUserId: string;
    refreshToken: string;
}

const userDataSchema: Schema<IUserData> = new Schema({
    discordUserId: {
        type: String,
        required: true,
        unique: true,
    },
    refreshToken: {
        type: String,
        required: true,
    }
});

const userDataModel: Model<IUserData> = mongoose.model<IUserData>('userRefreshToken', userDataSchema);

const storeRefreshToken = async (discordUserId: string, refreshToken: string): Promise<void> => {
    try {
        const result = await userDataModel.findOneAndUpdate(
            { discordUserId },
            { refreshToken },
            { new: true, upsert: true }
        );
        logger.info('Refresh token updated', result);
    } catch (error) {
        logger.info('Error saving refresh token', error);
    }
};

export {
    storeRefreshToken,
    connectDB
};
