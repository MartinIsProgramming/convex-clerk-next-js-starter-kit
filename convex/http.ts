import type { WebhookEvent } from "@clerk/backend";
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { httpAction } from "./_generated/server";

// === HTTP Status Constants ===
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_ERROR = 500;

// === Webhook Event Handlers ===

async function handleUserEvent(ctx: ActionCtx, evt: WebhookEvent): Promise<void> {
  if (evt.type === "user.created" || evt.type === "user.updated") {
    await ctx.runMutation(internal.users.upsertFromClerk, {
      clerkId: evt.data.id,
      email: evt.data.email_addresses[0]?.email_address ?? "",
      firstName: evt.data.first_name ?? undefined,
      lastName: evt.data.last_name ?? undefined,
      imageUrl: evt.data.image_url ?? undefined,
    });
    return;
  }

  if (evt.type === "user.deleted" && evt.data.id) {
    await ctx.runMutation(internal.users.deleteFromClerk, {
      clerkId: evt.data.id,
    });
  }
}

async function processWebhookEvent(ctx: ActionCtx, evt: WebhookEvent): Promise<void> {
  switch (evt.type) {
    case "user.created":
    case "user.updated":
    case "user.deleted":
      await handleUserEvent(ctx, evt);
      break;

    default:
      console.log(`[webhook] Unhandled event type: ${evt.type}`);
  }
}

// === HTTP Router ===

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { verifyWebhook } = await import("@clerk/backend/webhooks");

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[webhook] CLERK_WEBHOOK_SECRET not configured");
      return new Response("Webhook configuration error", { status: HTTP_INTERNAL_ERROR });
    }

    try {
      const evt = await verifyWebhook(request, {
        signingSecret: webhookSecret,
      });

      await processWebhookEvent(ctx, evt);

      return new Response("Webhook processed successfully", { status: HTTP_OK });
    } catch (error) {
      console.error("[webhook] Error processing:", error);
      return new Response(`Error processing webhook: ${error}`, {
        status: HTTP_BAD_REQUEST,
      });
    }
  }),
});

export default http;
