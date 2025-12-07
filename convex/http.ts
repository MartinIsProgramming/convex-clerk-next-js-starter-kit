import { verifyWebhook } from "@clerk/backend/webhooks";
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const evt = await verifyWebhook(request, {
        signingSecret: process.env.CLERK_WEBHOOK_SECRET,
      });

      switch (evt.type) {
        case "user.created":
          await ctx.runMutation(internal.users.createUser, {
            clerkId: evt.data.id,
            email: evt.data.email_addresses[0]?.email_address,
            firstName: evt.data.first_name ?? undefined,
            lastName: evt.data.last_name ?? undefined,
            imageUrl: evt.data.image_url ?? undefined,
          });
          break;

        case "user.updated":
          await ctx.runMutation(internal.users.updateUser, {
            clerkId: evt.data.id,
            email: evt.data.email_addresses[0]?.email_address,
            firstName: evt.data.first_name ?? undefined,
            lastName: evt.data.last_name ?? undefined,
            imageUrl: evt.data.image_url ?? undefined,
          });
          break;

        case "user.deleted":
          await ctx.runMutation(internal.users.deleteUser, {
            clerkId: evt.data.id!,
          });
          break;

        default:
          console.log(`[webhook] Unhandled event type: ${evt.type}`);
      }

      return new Response("Webhook processed successfully", { status: 200 });
    } catch (error) {
      return new Response(`Error processing webhook: ${error}`, {
        status: 400,
      });
    }
  }),
});

export default http;
