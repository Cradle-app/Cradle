# Running Cradle Locally

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm (will be installed via npx if not available)

### Installation

```bash
cd /path/to/cradle

# Install dependencies
npx --yes pnpm@9.0.0 install

# Build all packages
npx --yes pnpm@9.0.0 build
```

### Running Development Servers

**Option 1: Run both services together**
```bash
npx --yes pnpm@9.0.0 dev
```

**Option 2: Run services separately**

Terminal 1 - Orchestrator (Backend API):
```bash
npx --yes pnpm@9.0.0 --filter @cradle/orchestrator dev
# Runs on http://localhost:3000
```

Terminal 2 - Web App (Frontend):
```bash
npx --yes pnpm@9.0.0 --filter @cradle/web dev
# Runs on http://localhost:3001
```

## Using Cradle

1. **Open the app**: http://localhost:3001

2. **Build your foundation**:
   - Drag components from the left palette
   - Click nodes to configure properties
   - Connect components to define dependencies

3. **Generate your codebase**:
   - Click "Generate" in the header
   - Choose whether to create a GitHub repo
   - Get your foundation code

4. **Continue with AI**:
   - Open the generated code in Cursor or VS Code
   - Use AI assistance to add custom features
   - Build on your solid foundation

## Environment Variables

**apps/orchestrator/.env:**
```env
PORT=3000
CORS_ORIGIN=http://localhost:3001
GITHUB_TOKEN=your-personal-access-token
```

**apps/web/.env.local:**
```env
ORCHESTRATOR_URL=http://localhost:3000
GITHUB_CLIENT_ID=your-oauth-client-id
GITHUB_CLIENT_SECRET=your-oauth-client-secret
```

## GitHub OAuth Setup (Optional)

To enable "Connect GitHub" for automatic repo creation:

1. Create a GitHub OAuth App at https://github.com/settings/developers
2. Set callback URL to `http://localhost:3001/api/auth/github/callback`
3. Add credentials to `apps/web/.env.local`

Without OAuth, you can still:
- Design blueprints visually
- Export as JSON
- Generate code (without GitHub push)

## Accessing the Application

- **Frontend**: http://localhost:3001
- **Orchestrator API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## Project Structure

```
cradle/
├── apps/
│   ├── web/              # Next.js visual editor (port 3001)
│   └── orchestrator/     # Fastify generation engine (port 3000)
├── packages/
│   ├── blueprint-schema/ # Zod schemas & validation
│   ├── plugin-sdk/       # Plugin development kit
│   └── plugins/          # All component plugins
└── examples/             # Example blueprints
```

## Troubleshooting

### Port Already in Use

```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules
npx --yes pnpm@9.0.0 install
npx --yes pnpm@9.0.0 build
```

---

**Cradle** - Structure first, then vibe ✨
