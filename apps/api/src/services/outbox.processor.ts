import type { Kysely } from 'kysely';
import type { Database } from '@coursecity/database';
import type { ReceiptService } from './receipt.service.js';

export class OutboxProcessor {
  constructor(
    private readonly db: Kysely<Database>,
    private readonly receiptService?: ReceiptService,
  ) {}

  /**
   * Processes a batch of pending outbox events
   */
  async processPendingEvents(limit = 25): Promise<{ processed: number; failed: number }> {
    const events = await this.db
      .selectFrom('outbox_events')
      .selectAll()
      .where('status', '=', 'PENDING')
      .orderBy('created_at', 'asc')
      .limit(limit)
      .execute();

    let processedCount = 0;
    let failedCount = 0;

    for (const event of events) {
      try {
        await this.db
          .updateTable('outbox_events')
          .set({ status: 'PROCESSING' })
          .where('id', '=', event.id)
          .execute();

        const payload = JSON.parse(event.payload) as Record<string, unknown>;

        // Dispatch to domain side-effect handlers
        await this.handleEvent(event.event_name, payload);

        await this.db
          .updateTable('outbox_events')
          .set({
            status: 'DELIVERED',
            processed_at: new Date(),
          })
          .where('id', '=', event.id)
          .execute();

        processedCount++;
      } catch (err) {
        failedCount++;
        const currentRetryCount = event.retry_count + 1;
        const errorMessage = (err as Error).message || 'Unknown processing error';

        if (currentRetryCount >= 5) {
          // Dead letter dispatch after 5 failed attempts
          await this.db
            .insertInto('dead_letter_events')
            .values({
              original_event_id: event.id,
              event_name: event.event_name,
              payload: event.payload,
              last_error: errorMessage,
            })
            .execute();

          await this.db
            .updateTable('outbox_events')
            .set({
              status: 'FAILED',
              retry_count: currentRetryCount,
              processed_at: new Date(),
            })
            .where('id', '=', event.id)
            .execute();
        } else {
          // Retry later with incremented count
          await this.db
            .updateTable('outbox_events')
            .set({
              status: 'PENDING',
              retry_count: currentRetryCount,
            })
            .where('id', '=', event.id)
            .execute();
        }
      }
    }

    return { processed: processedCount, failed: failedCount };
  }

  private async handleEvent(eventName: string, payload: Record<string, unknown>): Promise<void> {
    switch (eventName) {
      case 'AUTH_USER_REGISTERED': {
        // Queue verification/welcome email
        const userEmail = payload.email as string;
        const userId = payload.userId as string;
        if (userEmail) {
          await this.db
            .insertInto('email_events')
            .values({
              user_id: userId || null,
              recipient_email: userEmail,
              template_name: 'WELCOME_VERIFY_EMAIL',
              status: 'QUEUED',
            })
            .execute();
        }
        break;
      }

      case 'COMMERCE_PAYMENT_VERIFIED': {
        // Ensure receipt is issued
        const paymentId = payload.paymentId as string;
        if (paymentId && this.receiptService) {
          await this.receiptService.issueReceiptForPayment(paymentId);
        }
        break;
      }

      case 'COMMERCE_RECEIPT_ISSUED': {
        // Queue receipt notification email
        const userEmail = payload.userEmail as string;
        const userId = payload.userId as string;
        if (userEmail) {
          await this.db
            .insertInto('email_events')
            .values({
              user_id: userId || null,
              recipient_email: userEmail,
              template_name: 'PAYMENT_RECEIPT',
              status: 'QUEUED',
            })
            .execute();
        }
        break;
      }

      case 'COMMERCE_ENROLLMENT_CREATED': {
        // Create in-app learner notification
        const userId = payload.userId as string;
        if (userId) {
          await this.db
            .insertInto('notifications')
            .values({
              user_id: userId,
              title: 'Enrollment Confirmed',
              message: 'You have been successfully enrolled in your course. Start reading now!',
              type: 'ENROLLMENT',
              is_read: false,
            })
            .execute();
        }
        break;
      }

      case 'LEARNING_COURSE_COMPLETED': {
        const userId = payload.userId as string;
        if (userId) {
          await this.db
            .insertInto('notifications')
            .values({
              user_id: userId,
              title: 'Course Completed! 🎉',
              message: 'Congratulations on completing 100% of the course curriculum!',
              type: 'ACHIEVEMENT',
              is_read: false,
            })
            .execute();
        }
        break;
      }

      default:
        // No-op for unhandled events
        break;
    }
  }
}
