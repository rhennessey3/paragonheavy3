---
description: Start development environment with Convex, Next.js, and ngrok
---

# Development Environment Setup

This workflow will help you start all required services for local development.

## Prerequisites

Ensure you have:
- Node.js v22+ installed
- npm installed
- ngrok installed and authenticated
- `.env.local` file configured (copy from `.env.example` if needed)

## Steps

### 1. Install Dependencies (if needed)

```bash
npm install
```

### 2. Start Convex Development Server

Open a new terminal and run:

```bash
npx convex dev
```

This will:
- Start the Convex backend in development mode
- Watch for changes in the `convex/` directory
- Connect to your Convex deployment (dev:resilient-goose-530)

**Keep this terminal running.**

### 3. Start Next.js Development Server

Open another terminal and run:

```bash
npm run dev
```

Or if you want to run both Convex and Next.js together (recommended):

```bash
npm run dev
```

This will start Next.js on `http://localhost:3000`

**Keep this terminal running.**

### 4. Start ngrok Tunnel (for webhooks)

Open a third terminal and run:

```bash
ngrok http 3000
```

This will:
- Create a public HTTPS URL that forwards to your local Next.js server
- Display the forwarding URL (e.g., `https://abc123.ngrok.io`)

**Important:** Copy the HTTPS forwarding URL - you'll need it for webhook configuration.

**Keep this terminal running.**

### 5. Configure Clerk Webhooks (if needed)

If you need to update webhook URLs in Clerk:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to your application (refined-monkey-47)
3. Go to **Webhooks** section
4. Update the endpoint URL to: `https://YOUR-NGROK-URL/api/webhooks/clerk`
5. Ensure the webhook secret matches `CLERK_WEBHOOK_SECRET` in your `.env.local`

### 6. Configure Upstash Webhooks (if needed)

If using Upstash Workflow for Clerk webhooks:

1. Update the Clerk webhook endpoint to: `https://YOUR-NGROK-URL/api/workflows/clerk`
2. Verify `QSTASH_URL` and `QSTASH_TOKEN` are set in your environment

## Verification

Your development environment is ready when:

- ✅ Convex dev server is running and connected
- ✅ Next.js is accessible at `http://localhost:3000`
- ✅ ngrok tunnel is active with HTTPS URL
- ✅ Webhooks are configured with the ngrok URL

## Quick Start (All Services)

For convenience, you can use the combined dev script:

```bash
npm run dev
```

Then in separate terminals:

```bash
ngrok http 3000
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
```

### Convex Authentication Issues

If you see Convex authentication errors:

```bash
npx convex dev --once --configure
```

### ngrok Session Expired

If ngrok session expires, restart it:

```bash
ngrok http 3000
```

Then update webhook URLs in Clerk/Upstash with the new ngrok URL.

## Stopping Services

To stop all services:

1. Press `Ctrl+C` in each terminal running a service
2. Verify no processes are still running on port 3000
