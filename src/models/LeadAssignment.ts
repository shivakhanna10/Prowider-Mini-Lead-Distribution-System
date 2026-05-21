import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeadAssignment extends Document {
  leadId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LeadAssignmentSchema: Schema = new Schema({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
  providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
  createdAt: { type: Date, default: Date.now },
});

// Adding index to ensure efficient polling for SSE (real-time stream)
LeadAssignmentSchema.index({ createdAt: -1 });

// Feature 2: "Same provider cannot receive the same lead twice" 
// Enforced at the database level.
LeadAssignmentSchema.index({ leadId: 1, providerId: 1 }, { unique: true });

const LeadAssignment: Model<ILeadAssignment> = mongoose.models.LeadAssignment || mongoose.model<ILeadAssignment>('LeadAssignment', LeadAssignmentSchema);

export default LeadAssignment;
