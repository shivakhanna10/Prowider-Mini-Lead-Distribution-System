import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebhookEvent extends Document {
  eventId: string;
  providerId: string;
  processedAt: Date;
}

const WebhookEventSchema: Schema = new Schema({
  eventId: { type: String, required: true, unique: true }, // The unique index for idempotency
  providerId: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
});

const WebhookEvent: Model<IWebhookEvent> = mongoose.models.WebhookEvent || mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);

export default WebhookEvent;
