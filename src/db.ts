import mongoose, { Schema, Document, Model } from 'mongoose';
import { mongodb } from './config.json';
import logger from './utils/logger';

const connectDB = async (): Promise<void> => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongodb.url);
  logger.info('MongoDB connected successfully');
};

// Define the interface for the document
interface IUserData extends Document {
  discordUserId: string;
  refreshToken: string;
}

const userDataSchema: Schema<IUserData> = new Schema<IUserData>({
  discordUserId: {
    type: String,
    required: true,
    unique: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
});

const userDataModel: Model<IUserData> = mongoose.model<IUserData>(
  'UserData',
  userDataSchema,
);

// Store the refresh token
const storeRefreshToken = async (
  discordUserId: string,
  refreshToken: string,
): Promise<void> => {
  try {
    const result = await userDataModel.findOneAndUpdate(
      { discordUserId },
      { refreshToken },
      { new: true, upsert: true },
    );
    logger.debug('Refresh token updated: ' + result);
  } catch (error) {
    logger.error(error);
  }
};

// Function to retrieve the refresh token for a specific user
const getRefreshToken = async (discordUserId: string): Promise<string | null> => {
  try {
    const userData = await userDataModel.findOne({ discordUserId });
    if (userData) {
      return userData.refreshToken;
    } else {
      logger.error(`No refresh token found for user: ${discordUserId}`);
      return null;
    }
  } catch (error) {
    logger.error('Error retrieving refresh token:', error);
    return null;
  }
};

export { storeRefreshToken, getRefreshToken, connectDB };
