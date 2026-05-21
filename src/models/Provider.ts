import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProvider extends Document {
  name: string;
  services: string[];
  alwaysReceive: string[];
  quota: number;
  lastAssignedAt: Date;
  assignedCount: number;
}

const ProviderSchema: Schema = new Schema({
  name: { type: String, required: true },
  services: { type: [String], required: true },
  alwaysReceive: { type: [String], default: [] },
  quota: { type: Number, default: 10, min: 0 },
  lastAssignedAt: { type: Date, default: new Date(0) }, // Initialize to epoch for fairness sorting
  assignedCount: { type: Number, default: 0 },
});

const Provider: Model<IProvider> = mongoose.models.Provider || mongoose.model<IProvider>('Provider', ProviderSchema);

export default Provider;
