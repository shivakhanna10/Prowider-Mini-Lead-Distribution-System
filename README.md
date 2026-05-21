# Lead Generation and Distribution System

This project simulates a real-world lead generation and distribution platform. It includes features for lead ingestion, fair allocation, real-time dashboard updates (SSE), high-concurrency handling, and webhook idempotency.

## 🚀 Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Database:**
   Ensure you have a local MongoDB instance running (or provide a cloud URI).
   Create a `.env` file in the root of the project (if not present) and add your connection string:
   ```env
   MONGODB_URI=mongodb://localhost:27017/lead-distribution
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

4. **Initialize Database:**
   Open your browser to [http://localhost:3000/test-tools](http://localhost:3000/test-tools) and click **"Seed / Reset Database"**. This will wipe old data, create dummy providers, and strictly enforce the necessary database indexes.

5. **Test the System:**
   - **Form:** [http://localhost:3000/request-service](http://localhost:3000/request-service)
   - **Dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
   - **Testing Tools:** [http://localhost:3000/test-tools](http://localhost:3000/test-tools)

---

## 🧠 Technical Architecture & Explanations

### 1. Allocation Algorithm
When a lead is submitted, it is assigned to a maximum of **3 providers**. The system follows a strict two-pass logic:
*   **Priority Tier ("Always Receive")**: The system first filters providers who specifically have the requested service listed in their `alwaysReceive` rule. These providers are given absolute priority for the allocation slots.
*   **Fairness Tier ("Round-Robin")**: If slots are still available (e.g., less than 3 priority providers exist), the system gathers the remaining eligible providers who offer the service. It then sorts them by `lastAssignedAt` in ascending order. This guarantees that the providers who have waited the longest for a lead are assigned next, enforcing strict fairness over time.

### 2. How Concurrency was Handled
Simultaneous lead creation requests (e.g., generating 10 leads at the exact same millisecond) naturally create race conditions where a provider's quota might be overdrawn.
*   **The Solution**: We bypassed standard "read-then-write" transactions in favor of **Atomic MongoDB Operations**. 
*   **Implementation**: When the algorithm attempts an assignment, it executes:
    ```javascript
    Provider.findOneAndUpdate(
       { _id: providerId, quota: { $gt: 0 } },
       { $inc: { quota: -1 }, $set: { lastAssignedAt: new Date() } }
    )
    ```
*   By combining the condition (`quota > 0`) and the deduction (`$inc: -1`) into a single atomic query, the database engine natively locks the document during the update. If 10 requests hit a provider with 1 remaining quota simultaneously, only the first request will succeed, and the remaining 9 will return null and safely move on to the next eligible provider in the queue.

### 3. How Webhook Idempotency is Ensured
Webhooks (like payment confirmations to reset quota) are notoriously unreliable and often trigger duplicate events for the same action.
*   **The Solution**: We enforce idempotency strictly at the **Database Storage Layer**.
*   **Implementation**: A `WebhookEvent` model was created with a strict **Unique Index** on the `eventId` field (`WebhookEventSchema.index({ eventId: 1 }, { unique: true })`).
*   When a webhook is received, the system attempts to insert the `eventId` into the database first. If the event is a duplicate, MongoDB physically rejects the insert, throwing an `E11000 Duplicate Key Error`. The API catches this specific error, skips the quota reset logic, and gracefully returns a `200 OK` (to satisfy the payment gateway) without performing the side effect twice.
