# Stonebridge AI Landing Page

Minimal Vite-style React starter for a one-page business landing page for Stonebridge AI in Los Angeles, CA.

## Run locally

```bash
npm install
npm run dev
```

## Included files

- `package.json`
- `index.html`
- `src/main.jsx`
- `src/App.jsx`
- `src/styles.css`

The page includes sections for hero, services, how it works, outcomes, who it's for, and a contact CTA.

## Deployment

Cloudflare Pages project: `stonebridge-ai-landing`

Active Pages domain: `https://agentic-solutions-landing.pages.dev/`

Primary custom domains:

- `https://stonebridgeai.co/`
- `https://www.stonebridgeai.co/`

Legacy custom domains remain attached during transition until the new domain is verified and removal is approved:

- `https://stonebridgebai.com/`
- `https://www.stonebridgebai.com/`

Deploy from this directory with:

```bash
npm run build
npx wrangler pages deploy dist --project-name stonebridge-ai-landing
```

Note: `https://stonebridge-ai-landing.pages.dev/` does not resolve. Cloudflare Pages subdomains are effectively immutable; changing that would require recreating the Pages project and reattaching domains/Git integration.
