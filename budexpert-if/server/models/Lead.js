import mongoose from 'mongoose'

const LeadSchema = new mongoose.Schema({
  type: { type: String, enum: ['call','delivery'], default: 'delivery', index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, default: '' },
  street: { type: String, default: '' },
  house: { type: String, default: '' },
  datetime: { type: Date },
  status: { type: String, enum: ['new','in_progress','done','cancelled'], default: 'new', index: true },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Lead', LeadSchema)
