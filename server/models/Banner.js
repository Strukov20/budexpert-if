import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema({
  key: { type: String, default: 'home', unique: true },
  images: {
    type: [
      {
        url: { type: String, trim: true },
        publicId: { type: String, trim: true },
        link: { type: String, trim: true },
      },
    ],
    default: [],
  },
}, { timestamps: true })

const Banner = mongoose.model('Banner', bannerSchema)
export default Banner
