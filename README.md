# Next.js Convex Starter

A full-stack starter kit with Next.js 15, Convex, Clerk authentication, and shadcn/ui.

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4 |
| Backend | Convex |
| Auth | Clerk |
| UI | shadcn/ui, Radix UI, Lucide Icons |
| Tooling | TypeScript 5.9, Biome, Knip, pnpm |

## Features

- Clerk authentication (sign-in/sign-up)
- User sync via Clerk → Convex webhooks
- Protected dashboard with responsive sidebar
- Pre-configured shadcn/ui components
- Strict TypeScript
- Biome linting & formatting
- Knip for detecting unused code & dependencies

## Prerequisites

- Node.js 18+
- pnpm
- [Convex account](https://convex.dev/)
- [Clerk account](https://clerk.com/)

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd starter-kit
pnpm install
```

### 2. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

### 3. Configure Convex

```bash
npx convex dev
```

This will prompt you to log in and create a new project.

### 4. Configure Clerk

1. Create a new application in [Clerk Dashboard](https://dashboard.clerk.com/)
2. Copy your API keys to `.env.local`
3. Create a JWT template named "convex" and copy the Issuer URL

### 5. Set up Clerk webhook (for user sync)

1. Go to Clerk Dashboard → Webhooks
2. Create a new webhook with endpoint: `<YOUR_CONVEX_URL>/clerk-users-webhook`
3. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
4. Copy the Signing Secret to Convex Dashboard → Settings → Environment Variables as `CLERK_WEBHOOK_SECRET`

### 6. Run development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | Your Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Webhook signing secret (set in Convex Dashboard) |
| `CLERK_JWT_ISSUER_DOMAIN` | JWT template Issuer URL |
| `CONVEX_DEPLOYMENT` | Convex deployment ID |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in page URL (`/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up page URL (`/sign-up`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Redirect after sign-in (`/dashboard`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Redirect after sign-up (`/dashboard`) |

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server (frontend + backend) |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Check code with Biome |
| `pnpm lint:fix` | Auto-fix linting issues |
| `pnpm format` | Format code with Biome |
| `pnpm knip` | Find unused code & dependencies |
| `pnpm knip:fix` | Auto-remove unused exports |

## Project Structure

```
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── (auth)/             # Auth routes (sign-in, sign-up)
│   │   └── (dashboard)/        # Protected dashboard routes
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   └── layout/             # Layout components
│   ├── features/
│   │   └── dashboard/          # Dashboard feature module
│   │       ├── components/     # Sidebar, nav components
│   │       ├── config/         # Sidebar configuration
│   │       └── types/          # TypeScript types
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities (auth, cn)
│   ├── provider/               # Context providers
│   └── middleware.ts           # Clerk auth middleware
├── convex/
│   ├── schema.ts               # Database schema
│   ├── users.ts                # User queries & mutations
│   ├── auth.config.ts          # Clerk JWT config
│   └── http.ts                 # Webhook endpoint
└── public/                     # Static assets
```

## License

MIT
