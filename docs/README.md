# Droid SDK Documentation

This documentation site is built with [Docusaurus](https://docusaurus.io/).

## Structure

```
docs/
├── content/           # Documentation content (MDX files)
│   ├── introduction.mdx
│   ├── quickstart.mdx
│   ├── installation.mdx
│   ├── api-reference/
│   ├── concepts/
│   └── guides/
├── src/               # Custom React components and CSS
├── static/            # Static assets (images, etc.)
├── docusaurus.config.ts
├── sidebars.ts
└── package.json
```

## Development

```bash
cd docs
bun install
bun start
```

## Build

```bash
bun run build
```

## Deployment

The site is deployed to GitHub Pages at [activadee.github.io/droid-sdk](https://activadee.github.io/droid-sdk/).
