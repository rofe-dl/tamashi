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

const getRefreshToken = async (discordUserId: string): Promise<string | undefined> => {
  const userData = await userDataModel.findOne({ discordUserId });

  return userData?.refreshToken;
};

const deleteRefreshToken = async (discordUserId: string): Promise<void> => {
  await userDataModel.findOneAndDelete({ discordUserId });
};

export { storeRefreshToken, getRefreshToken, connectDB, deleteRefreshToken };
