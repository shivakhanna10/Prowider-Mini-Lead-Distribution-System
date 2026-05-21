import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILead extends Document {
  name: string;
  phoneNumber: string;
  city: string;
  service: string;
  description: string;
  status: string; // 'unassigned', 'assigned'
  createdAt: Date;
}

const LeadSchema: Schema = new Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  city: { type: String, required: true },
  service: { type: String, required: true },
  description: { type: String, required: false },
  status: { type: String, enum: ['unassigned', 'assigned'], default: 'unassigned' },
  createdAt: { type: Date, default: Date.now },
});

// Feature 1: Duplicate Rule
// Same phone number cannot create another lead for the SAME service.
// This rule MUST be enforced at the database level.
LeadSchema.index({ phoneNumber: 1, service: 1 }, { unique: true });

const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
