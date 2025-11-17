import mongoose from 'mongoose'

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  street: { type: String, required: true },
  house: { type: String, required: true },
  datetime: { type: Date, required: true },
  status: { type: String, enum: ['new','in_progress','done','cancelled'], default: 'new', index: true },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Lead', LeadSchema)
