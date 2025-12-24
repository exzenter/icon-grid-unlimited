# Icon Grid Unlimited

**Version**: 1.3.0

**[Live Demo](https://exzenter.github.io/icon-grid-animated/)**

Animated icon grid (up to 12x12) with GSAP for EXZENT Webdesign. Tiles show wireframe icons that fill with gradient on hover. Auto-highlight loop draws animated connecting lines between tiles in predefined patterns.

## Features

- **Configurable Grid Size** from 1x1 up to 12x12 (default 6x6)
- **Data Preservation** when resizing - tiles outside current bounds are hidden but not deleted
- **Enlarge Grid After Event** - Show subgrid initially, expand to full grid on trigger (button/event/scroll)
- **Hover Effects**: Wireframe → gradient fill, tile scales up with shadow, label appears
- **Auto-Highlight Loop**: Plays predefined connection animation rounds in sequence
- **Multi-Connection Support**: 2-tile and 3-tile connections, plus simultaneous groups
- **Orthogonal Lines**: 90° lines with rounded corners (default on)
- **Diagonal Mode**: Per-connection override with `'d'` marker
- **Smart Offsets**: Auto-offset for overlapping 3-tile connections
- **Entrance/Leave Animations**: Fade in/out with staggered delays
- **Scroll-Triggered Entrance**: Uses Intersection Observer to animate when visible
- **Pause on Scroll-Out**: Saves resources when grid not visible, resumes when visible
- **Configurable Startup Delay**: Set delay between entrance animation and loop start
- **Responsive Grid**: Scales proportionally on all screen sizes
- **Sticky Layout Support**: Vertical centering with dynamic offset calculation
- **Performance Optimized**: DOM caching, GPU layer hints (`will-change`)
- **SEO Optimized**: Schema.org structured data, semantic URLs, accessibility

## Quick Start

1. Open `index.html` in a browser
2. Grid animates in automatically with entrance animation
3. Connection animations loop continuously

## Configuration

### Grid Layout (`iconLabels`)

```javascript
const iconLabels = [
    '', 'Paid Ads', 'SEO/GEO', '', 'Typografie', 'Farben',
    // ... up to 144 positions (12x12 grid)
];
```
- Empty string `''` = placeholder cell
- Non-empty string = icon tile with that label

### Animation Rounds (`ANIMATION_ROUNDS`)

```javascript
const ANIMATION_ROUNDS = [
    [[2, 3], [2, 7]],           // Two 2-tile connections simultaneously
    [[2, 7], [15, 2, 3, 'd']]   // First ortho, second diagonal (3-tile)
];
```

**Format**: Each round is an array of connection groups.

| Pattern | Description |
|---------|-------------|
| `[source, target]` | 2-tile connection |
| `[source, t1, t2]` | 3-tile connection (source → both targets) |
| `[..., 'd']` | Diagonal mode override |

**Positions**: 1-based grid positions (1-36 for 6x6, up to 1-144 for 12x12)

### Timing (`CONFIG`)

```javascript
const CONFIG = {
    lineDrawDuration: 0.5,    // seconds to draw/retract line
    highlightDuration: 1499,  // ms to keep cells highlighted
    loopInterval: 2500,       // ms between rounds
    cellAnimDuration: 0.5,    // seconds for cell hover animation
    turnOffset: 8,            // px offset for ortho turns
    cornerRadius: 20,         // px radius for ortho corners
};
```

### SEO Data (`SEO_DATA`)

Update URLs and descriptions for each service:

```javascript
const SEO_DATA = {
    'Webdesign': {
        url: '/leistungen/webdesign/',
        description: 'Modernes Webdesign für responsive Websites',
        serviceType: 'Web Design'
    },
    // ...
};
```

## Controls

| Button | Action |
|--------|--------|
| Enter | Replay entrance animation |
| Leave | Play leave animation (fade out) |
| Ortho | Toggle orthogonal lines (default: on) |

## Console Commands

```javascript
replayEntranceAnimation()  // Restart entrance
playLeaveAnimation()       // Fade out all tiles
startHighlightLoop()       // Start auto-highlight
stopHighlightLoop()        // Stop auto-highlight
```

## Tech Stack

- HTML5 / CSS3
- GSAP 3.12.5 (CDN)
- Vanilla JavaScript
- Schema.org Structured Data

## WordPress Plugin

A full Gutenberg block is included in the main plugin directory.

### Plugin Features

- **Variable Grid Size**: Configure rows and columns (1-12 each)
- **Enlarge Grid After Event**: Show subgrid initially, expand on button/event/scroll trigger
- **Block Editor Controls**: Visual configuration of all settings
- **Icon Style Settings**: Scale, X/Y offset, stroke color/width
- **Hover Settings**: Scale, background color, slide amount
- **Timing Controls**: 1ms precision for all animation timings
- **Transition Offset**: Overlap/delay between animation rounds (-3s to +3s)
- **Per-Tile Icon Settings**: Individual offset and scale per icon
- **Per-Tile Cell Size**: Width/height modifiers (20-400%), centering, manual offsets, label scaling
- **Layout Settings**: Sticky toggle, vertical centering with target selector
- **Popup Color Pickers**: Compact color selection for all color options
- **Grid Editor Modal**: Visual 12x12 grid for tile configuration (out-of-bounds tiles greyed out)
- **Block Tiles**: Embed Gutenberg blocks directly into tiles with hover animations

### Build

```bash
npm install
npm run build
```

## SEO Features

- **Schema.org ItemList** with Service items (auto-injected)
- **Semantic URLs** linked to service pages
- **Title attributes** on all links
- **ARIA labels** on SVG icons
- **Screen-reader descriptions** (`.sr-only` class)

## License

MIT
