# Icon Grid Unlimited

A WordPress Gutenberg block plugin that renders an animated icon grid (up to 12×12). Tiles display wireframe SVG icons that fill with a gradient on hover. An auto-highlight loop draws animated orthogonal or diagonal connecting lines between tiles in configurable rounds.

Key capabilities:

- Configurable grid size (1×1 to 12×12), with data preservation when resizing
- Enlarge/expand mode: show a subgrid initially, expand to full grid on trigger (button click, custom event, or scroll position)
- Per-tile settings: icon scale/offset, cell size overrides, block tile embedding
- Animation rounds system: define sequences of 2-tile or 3-tile connections with staggered timing
- Sticky layout support with vertical centering
- SEO: Schema.org structured data, semantic URLs, ARIA labels, screen-reader descriptions
- Frontend animation powered by anime.js with IntersectionObserver for lazy start/pause
- Exposes a global JS API (`window.iconGridUnlimited`) for external control of tile highlight/unhighlight

Author: EXZENT (exzent.de). Version: 1.3.0.
