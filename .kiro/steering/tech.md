# Tech Stack & Build

## Stack

- WordPress Gutenberg Block (Block API v3, `block.json` registration)
- PHP 7.4+ for server-side rendering (`render_callback`)
- JavaScript (ES modules) for editor and frontend
- SCSS for styles (compiled by `@wordpress/scripts`)
- anime.js 3.2.2 for frontend animations

## Build System

Uses `@wordpress/scripts` (v27) which wraps webpack internally.

### Commands

```bash
npm install        # Install dependencies
npm run build      # Production build → outputs to build/
npm run start      # Development build with watch mode
```

### Build Output (`build/`)

- `index.js` / `index.css` — Editor bundle (block registration + edit component + editor styles)
- `style-index.css` — Frontend styles (loaded on both editor and frontend)
- `view.js` — Frontend-only script (animations, hover effects, IntersectionObserver)
- `block.json` — Copied from `src/block.json`
- `*.asset.php` — Auto-generated dependency manifests

## Key Libraries

| Library                   | Purpose                                         | Location       |
| ------------------------- | ----------------------------------------------- | -------------- |
| `@wordpress/scripts`      | Build toolchain (webpack, babel, postcss)       | devDependency  |
| `@wordpress/blocks`       | Block registration (`registerBlockType`)        | wp dependency  |
| `@wordpress/block-editor` | `useBlockProps`, `InspectorControls`            | wp dependency  |
| `@wordpress/components`   | UI controls (`PanelBody`, `RangeControl`, etc.) | wp dependency  |
| `animejs`                 | Frontend animation engine                       | npm dependency |

## WordPress Integration

- Plugin entry: `icon-grid-unlimited.php` registers the block via `register_block_type()` with a `render_callback`
- Server-side rendering: `includes/render.php` (main) and `includes/render_clean.php` (variant)
- Block uses dynamic rendering (`save()` returns `null`); all frontend HTML is generated in PHP
- SVG sanitization via `wp_kses` whitelist in `icon_grid_sanitize_svg()`
