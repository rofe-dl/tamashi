const config = require('./config.json')
const mongoose = require("mongoose")
const { Schema } = mongoose

const uri = config.mongodb.url

const connectDB = async () => {
    try {
        await mongoose.connect(uri);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);

    }
};

const userDataSchema = new Schema({
    discordUserId: {
        type: String,
        required: true,
        unique: true,
    },
    refreshToken: {
        type: String,
        required: true,
    }
})
const userDataModel = mongoose.model('userRefreshToken', userDataSchema)



const storeRefreshToken = async (discordUserId, refreshToken) => {
    try {
        const result = await userDataModel.findOneAndUpdate(
            { discordUserId },
            { refreshToken },
            { new: true, upsert: true }
        )
        console.log('Refresh token updated', result)

    } catch (error) {
        console.error('Error saving refresh token', error)
    }

}


module.exports = {
    storeRefreshToken,
    connectDB
}