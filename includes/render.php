<?php
/**
 * Icon Grid Block - Frontend Render
 * 
 * @var array $attributes Block attributes
 * @var string $block_id Unique block ID
 * @var string $config_json JSON-encoded config
 */

// Default gradient definitions for icons
$default_gradients = [
    ['#e74c3c', '#f39c12'],
    ['#3498db', '#9b59b6'],
    ['#2ecc71', '#1abc9c'],
    ['#f39c12', '#e67e22'],
    ['#9b59b6', '#8e44ad'],
    ['#1abc9c', '#16a085'],
    ['#e67e22', '#d35400'],
    ['#34495e', '#2c3e50'],
    ['#3498db', '#2980b9'],
    ['#2ecc71', '#27ae60'],
    ['#f1c40f', '#f39c12'],
    ['#e74c3c', '#c0392b'],
    ['#00cec9', '#81ecec'],
    ['#a55eea', '#d1a3ff'],
    ['#20bf6b', '#26de81'],
    ['#fc5c65', '#fd9644'],
];

/**
 * Sanitize SVG content using wp_kses whitelist
 */
if (!function_exists('icon_grid_sanitize_svg')) {
    function icon_grid_sanitize_svg($svg_content) {
        $allowed_svg_tags = [
            'path' => [
                'd' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true,
                'stroke-linecap' => true, 'stroke-linejoin' => true, 'transform' => true,
                'opacity' => true, 'fill-opacity' => true, 'stroke-opacity' => true,
                'class' => true, 'id' => true, 'fill-rule' => true, 'clip-rule' => true
            ],
            'circle' => [
                'cx' => true, 'cy' => true, 'r' => true, 'fill' => true, 'stroke' => true,
                'stroke-width' => true, 'transform' => true, 'opacity' => true, 'class' => true
            ],
            'ellipse' => [
                'cx' => true, 'cy' => true, 'rx' => true, 'ry' => true, 'fill' => true,
                'stroke' => true, 'stroke-width' => true, 'transform' => true, 'class' => true, 'style' => true
            ],
            'rect' => [
                'x' => true, 'y' => true, 'width' => true, 'height' => true, 'rx' => true,
                'ry' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true,
                'transform' => true, 'class' => true
            ],
            'polygon' => [
                'points' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true,
                'stroke-linecap' => true, 'stroke-linejoin' => true, 'transform' => true, 'class' => true
            ],
            'polyline' => [
                'points' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true,
                'stroke-linecap' => true, 'stroke-linejoin' => true, 'transform' => true, 'class' => true
            ],
            'line' => [
                'x1' => true, 'y1' => true, 'x2' => true, 'y2' => true, 'stroke' => true,
                'stroke-width' => true, 'stroke-linecap' => true, 'transform' => true, 'class' => true
            ],
            'g' => [
                'fill' => true, 'stroke' => true, 'transform' => true, 'opacity' => true,
                'class' => true, 'id' => true
            ],
            'defs' => [],
            'lineargradient' => [
                'id' => true, 'x1' => true, 'y1' => true, 'x2' => true, 'y2' => true,
                'gradientunits' => true, 'gradienttransform' => true, 'spreadmethod' => true
            ],
            'radialgradient' => [
                'id' => true, 'cx' => true, 'cy' => true, 'r' => true, 'fx' => true, 'fy' => true,
                'gradientunits' => true, 'gradienttransform' => true, 'spreadmethod' => true
            ],
            'stop' => [
                'offset' => true, 'stop-color' => true, 'stop-opacity' => true, 'style' => true
            ],
        ];
        return wp_kses($svg_content, $allowed_svg_tags);
    }
}
?>

<?php
// Grid size settings
$gridRows = $attributes['gridRows'] ?? 6;
$gridCols = $attributes['gridCols'] ?? 6;
$totalTiles = $gridRows * $gridCols;

// Enlarge grid settings
$enlargeEnabled = $attributes['enlargeEnabled'] ?? false;
$subgridRows = $attributes['subgridRows'] ?? $gridRows;
$subgridCols = $attributes['subgridCols'] ?? $gridCols;
$subgridStartRow = $attributes['subgridStartRow'] ?? 0;
$subgridStartCol = $attributes['subgridStartCol'] ?? 0;
$enlargeTriggerButton = $attributes['enlargeTriggerButton'] ?? '';
$enlargeTriggerEvent = $attributes['enlargeTriggerEvent'] ?? '';
$enlargeTriggerScroll = $attributes['enlargeTriggerScroll'] ?? 0;

// Calculate visible grid size (subgrid if enlarge enabled, otherwise full grid)
$visibleRows = $enlargeEnabled ? $subgridRows : $gridRows;
$visibleCols = $enlargeEnabled ? $subgridCols : $gridCols;

// Extract config values for styles
$iconScale = $attributes['config']['iconScale'] ?? 1;
$inactiveBorderColor = $attributes['config']['inactiveBorderColor'] ?? '#00000031';
$inactiveStrokeColor = $attributes['config']['inactiveStrokeColor'] ?? '#333333';
$inactiveStrokeWidth = $attributes['config']['inactiveStrokeWidth'] ?? 1.5;
$iconOffsetX = $attributes['config']['iconOffsetX'] ?? 0;
$iconOffsetY = $attributes['config']['iconOffsetY'] ?? 0;
$inactiveGlass = $attributes['config']['inactiveGlass'] ?? false;
$inactiveGlassBlur = $attributes['config']['inactiveGlassBlur'] ?? 10;
$gridGapMin = $attributes['config']['gridGapMin'] ?? 6;
$gridGapMax = $attributes['config']['gridGapMax'] ?? 15;
$tileBorderRadius = $attributes['config']['tileBorderRadius'] ?? 5;
$inactiveBgColor = $attributes['config']['inactiveBgColor'] ?? 'rgba(255,255,255,0)';
$activeShadowX = $attributes['config']['activeShadowX'] ?? 0;
$activeShadowY = $attributes['config']['activeShadowY'] ?? 8;
$activeShadowBlur = $attributes['config']['activeShadowBlur'] ?? 10;
$activeShadowSpread = $attributes['config']['activeShadowSpread'] ?? 0;
$activeShadowColor = $attributes['config']['activeShadowColor'] ?? 'rgba(0,0,0,0.10)';
$perTileIconSettings = $attributes['perTileIconSettings'] ?? [];
$tileBlockSettings = $attributes['tileBlockSettings'] ?? [];
$tileBlocks = $attributes['tileBlocks'] ?? [];

// Sticky settings
$stickyEnabled = $attributes['stickyEnabled'] ?? false;
$stickyOffset = $attributes['stickyOffset'] ?? 20;
$centerVertically = $attributes['centerVertically'] ?? false;
$centerTargetSelector = $attributes['centerTargetSelector'] ?? '';
$stickyClass = $stickyEnabled ? ' is-sticky' : '';
$centerClass = $centerVertically ? ' center-vertically' : '';
$enlargeClass = $enlargeEnabled ? ' enlarge-mode' : '';
$stickyStyle = $stickyEnabled ? 'position: sticky; top: ' . esc_attr($stickyOffset) . 'px; align-self: flex-start;' : '';
?>

<div id="<?php echo esc_attr($block_id); ?>" class="wp-block-icon-grid-unlimited-icon-grid<?php echo $stickyClass . $centerClass . $enlargeClass; ?>" <?php if ($stickyStyle): ?>style="<?php echo $stickyStyle; ?>"<?php endif; ?> data-center-vertically="<?php echo $centerVertically ? 'true' : 'false'; ?>" data-center-target="<?php echo esc_attr($centerTargetSelector); ?>" data-grid-rows="<?php echo esc_attr($gridRows); ?>" data-grid-cols="<?php echo esc_attr($gridCols); ?>" data-enlarge-enabled="<?php echo $enlargeEnabled ? 'true' : 'false'; ?>" data-subgrid-rows="<?php echo esc_attr($subgridRows); ?>" data-subgrid-cols="<?php echo esc_attr($subgridCols); ?>" data-subgrid-start-row="<?php echo esc_attr($subgridStartRow); ?>" data-subgrid-start-col="<?php echo esc_attr($subgridStartCol); ?>" data-trigger-button="<?php echo esc_attr($enlargeTriggerButton); ?>" data-trigger-event="<?php echo esc_attr($enlargeTriggerEvent); ?>" data-trigger-scroll="<?php echo esc_attr($enlargeTriggerScroll); ?>">
    <style>
        #<?php echo esc_attr($block_id); ?> .icon-grid-container {
            --grid-gap: clamp(<?php echo esc_attr($gridGapMin); ?>px, 2vw, <?php echo esc_attr($gridGapMax); ?>px);
            grid-template-columns: repeat(<?php echo esc_attr($visibleCols); ?>, 1fr);
            position: relative;
            <?php if ($enlargeEnabled): ?>overflow: visible;<?php endif; ?>
        }
        #<?php echo esc_attr($block_id); ?> .icon-grid-cell-bg {
            border-color: <?php echo esc_attr($inactiveBorderColor); ?>;
            border-radius: <?php echo esc_attr($tileBorderRadius); ?>px;
            background: <?php echo esc_attr($inactiveBgColor); ?>;
            <?php if ($inactiveGlass): ?>
            backdrop-filter: blur(<?php echo esc_attr($inactiveGlassBlur); ?>px);
            -webkit-backdrop-filter: blur(<?php echo esc_attr($inactiveGlassBlur); ?>px);
            <?php endif; ?>
        }
        #<?php echo esc_attr($block_id); ?> .icon-grid-cell > .icon-grid-wrapper svg {
            transform: scale(<?php echo esc_attr($iconScale); ?>) translateX(<?php echo esc_attr($iconOffsetX); ?>%) translateY(<?php echo esc_attr($iconOffsetY); ?>%);
            transform-origin: center center;
        }
        #<?php echo esc_attr($block_id); ?> .icon-grid-wireframe path,
        #<?php echo esc_attr($block_id); ?> .icon-grid-wireframe circle,
        #<?php echo esc_attr($block_id); ?> .icon-grid-wireframe rect,
        #<?php echo esc_attr($block_id); ?> .icon-grid-wireframe polygon,
        #<?php echo esc_attr($block_id); ?> .icon-grid-wireframe polyline,
        #<?php echo esc_attr($block_id); ?> .icon-grid-wireframe line,
        #<?php echo esc_attr($block_id); ?> .icon-grid-wireframe ellipse {
            stroke: <?php echo esc_attr($inactiveStrokeColor); ?>;
            stroke-width: <?php echo esc_attr($inactiveStrokeWidth); ?>;
            vector-effect: non-scaling-stroke;
        }
        <?php if ($enlargeEnabled): ?>
        /* Expansion tile positioning - absolute, hidden initially */
        #<?php echo esc_attr($block_id); ?> .expansion-tile {
            position: absolute;
            opacity: 0;
            pointer-events: none;
            box-sizing: border-box;
        }
        #<?php echo esc_attr($block_id); ?>.enlarged .expansion-tile {
            pointer-events: auto;
        }
        <?php endif; ?>
        <?php 
        // Generate per-tile icon CSS overrides
        foreach ($perTileIconSettings as $tileIndex => $settings) :
            if (!empty($settings['enabled'])) :
                $tileScale = $settings['scale'] ?? 1;
                $tileOffsetX = $settings['offsetX'] ?? 0;
                $tileOffsetY = $settings['offsetY'] ?? 0;
                $cellWidth = $settings['cellWidth'] ?? 100;
                $cellHeight = $settings['cellHeight'] ?? 100;
                $centerCell = !empty($settings['centerCell']);
                $cellOffsetX = $settings['cellOffsetX'] ?? 0;
                $cellOffsetY = $settings['cellOffsetY'] ?? 0;
                $scaleLabel = !empty($settings['scaleLabel']);
                $storageIdx = intval($tileIndex);
                
                // Calculate centering translation if enabled
                // CSS transform percentage is relative to the element's own size, not parent
                // To move by X% of parent when element is W% of parent:
                // translateX = X / (W/100) = X * 100 / W
                // For centering: X = -(W-100)/2, so translateX = -(W-100)/2 * 100/W = -(W-100)*50/W
                $centerTranslateX = $centerCell && $cellWidth > 0 ? -($cellWidth - 100) * 50 / $cellWidth : 0;
                $centerTranslateY = $centerCell && $cellHeight > 0 ? -($cellHeight - 100) * 50 / $cellHeight : 0;
                
                // Add manual offset (convert from parent-relative to element-relative)
                $manualTranslateX = $cellWidth > 0 ? $cellOffsetX * 100 / $cellWidth : 0;
                $manualTranslateY = $cellHeight > 0 ? $cellOffsetY * 100 / $cellHeight : 0;
                
                // Total translation
                $totalTranslateX = $centerTranslateX + $manualTranslateX;
                $totalTranslateY = $centerTranslateY + $manualTranslateY;
                
                // Calculate label scale factor (average of width and height scale)
                $labelScale = ($cellWidth + $cellHeight) / 200;
        ?>
        #<?php echo esc_attr($block_id); ?> .icon-grid-cell-wrapper[data-storage-index="<?php echo $storageIdx; ?>"] .icon-grid-cell > .icon-grid-wrapper svg {
            transform: scale(<?php echo esc_attr($tileScale); ?>) translateX(<?php echo esc_attr($tileOffsetX); ?>%) translateY(<?php echo esc_attr($tileOffsetY); ?>%);
        }
        <?php if ($cellWidth != 100 || $cellHeight != 100) : ?>
        #<?php echo esc_attr($block_id); ?> .icon-grid-cell-wrapper[data-storage-index="<?php echo $storageIdx; ?>"] .icon-grid-cell {
            width: <?php echo esc_attr($cellWidth); ?>%;
            height: <?php echo esc_attr($cellHeight); ?>%;
            z-index: 10;
            <?php if ($centerCell || $cellOffsetX !== 0 || $cellOffsetY !== 0) : ?>
            transform: translateX(<?php echo esc_attr($totalTranslateX); ?>%) translateY(<?php echo esc_attr($totalTranslateY); ?>%);
            <?php endif; ?>
        }
        <?php if ($scaleLabel) : ?>
        #<?php echo esc_attr($block_id); ?> .icon-grid-cell-wrapper[data-storage-index="<?php echo $storageIdx; ?>"] .icon-grid-label {
            font-size: calc(clamp(8px, 1.5vw, 11px) * <?php echo esc_attr($labelScale); ?>);
        }
        <?php endif; ?>
        <?php endif; ?>
        <?php 
            endif;
        endforeach; 
        ?>
        /* Block tile styles */
        #<?php echo esc_attr($block_id); ?> .icon-grid-cell.block-tile .block-content {
            position: absolute;
            inset: 0;
            z-index: 70;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        #<?php echo esc_attr($block_id); ?> .icon-grid-cell.block-tile .block-content > * {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        #<?php echo esc_attr($block_id); ?> .icon-grid-cell.block-tile.hover-opacity .block-content {
            opacity: 0.3;
            transition: opacity 0.3s ease;
        }
        #<?php echo esc_attr($block_id); ?> .icon-grid-cell.block-tile.hover-opacity:hover .block-content,
        #<?php echo esc_attr($block_id); ?> .icon-grid-cell.block-tile.hover-opacity.active .block-content {
            opacity: 1;
        }
    </style>
    <div class="icon-grid-wrapper">
        <div class="icon-grid-container" data-config='<?php echo esc_attr($config_json); ?>'>
            <?php 
            $iconIndex = 0;
            $subgridPosition = 0; // Position counter for subgrid tiles (1-based)
            $expansionTiles = []; // Store expansion tiles to render after subgrid
            
            // Loop through all max grid positions
            for ($maxRow = 0; $maxRow < $gridRows; $maxRow++):
                for ($maxCol = 0; $maxCol < $gridCols; $maxCol++):
                    // Convert to storage index (12-column layout)
                    $storageIndex = $maxRow * 12 + $maxCol;
                    $label = $attributes['iconLabels'][$storageIndex] ?? '';
                    
                    // Full grid position (1-based) - used for animation rounds lookup
                    // This matches what the animation rounds editor shows
                    $fullGridPosition = $maxRow * $gridCols + $maxCol + 1;
                    
                    // Check if this tile is in the subgrid
                    $isInSubgrid = !$enlargeEnabled || (
                        $maxRow >= $subgridStartRow && $maxRow < $subgridStartRow + $subgridRows &&
                        $maxCol >= $subgridStartCol && $maxCol < $subgridStartCol + $subgridCols
                    );
                    
                    if ($isInSubgrid):
                        // Render subgrid tile normally in grid flow
                        $subgridPosition++;
                        $position = $subgridPosition;
                        
                        // Get per-tile transition settings
                        $tileSettings = $perTileIconSettings[$storageIndex] ?? [];
                        $isTransitionSource = !empty($tileSettings['isTransitionSource']);
                        $transitionId = $tileSettings['transitionId'] ?? '';
                        $transitionScaleExplode = $tileSettings['transitionScaleExplode'] ?? 100;
                        $transitionColorOverride = $tileSettings['transitionColorOverride'] ?? '';
                        $seoUrl = ($attributes['seoData'][$label]['url'] ?? '#');
                        
                        // Build transition data attributes
                        $transitionAttrs = '';
                        if ($isTransitionSource && !empty($label)) {
                            $transitionAttrs = ' data-transition-role="source"';
                            $transitionAttrs .= ' data-transition-id="' . esc_attr($transitionId) . '"';
                            $transitionAttrs .= ' data-transition-link="' . esc_url($seoUrl) . '"';
                            $transitionAttrs .= ' data-transition-scale-explode="' . esc_attr($transitionScaleExplode) . '"';
                            if (!empty($transitionColorOverride)) {
                                $transitionAttrs .= ' data-transition-color="' . esc_attr($transitionColorOverride) . '"';
                            }
                        }
            ?>
                <div class="icon-grid-cell-wrapper<?php echo empty($label) ? ' empty-cell' : ''; ?>" data-position="<?php echo $position; ?>" data-full-grid-position="<?php echo $fullGridPosition; ?>" data-storage-index="<?php echo $storageIndex; ?>"<?php echo $transitionAttrs; ?>>
                    <?php if (!empty($label)): 
                        $seoInfo = $attributes['seoData'][$label] ?? ['url' => '#', 'description' => $label];
                        $svgPath = $attributes['iconSvgs'][$storageIndex] ?? '';
                        $gradient = $default_gradients[$iconIndex % count($default_gradients)];
                        $gradientId = 'grad-' . $block_id . '-' . $iconIndex;
                        
                        // Check if this is a block-enabled tile
                        $blockSettings = $tileBlockSettings[$storageIndex] ?? ['enabled' => false];
                        $isBlockTile = !empty($blockSettings['enabled']);
                        $blockContent = $tileBlocks[$storageIndex] ?? '';
                        
                        // Build CSS classes for block tiles
                        $cellClasses = 'icon-grid-cell';
                        if ($isBlockTile) {
                            $cellClasses .= ' block-tile';
                            if (!empty($blockSettings['hoverOpacity'])) $cellClasses .= ' hover-opacity';
                            if (!empty($blockSettings['hoverScale'])) $cellClasses .= ' hover-scale';
                        }
                    ?>
                        <a class="<?php echo esc_attr($cellClasses); ?>" 
                           href="<?php echo esc_url($seoInfo['url'] ?? '#'); ?>"
                           title="<?php echo esc_attr($label . ' - Mehr erfahren'); ?>">
                            
                            <div class="icon-grid-cell-bg"></div>
                            
                            <?php if ($isBlockTile && !empty($blockContent)): ?>
                                <div class="block-content">
                                    <?php echo $blockContent; ?>
                                </div>
                                <?php if (!empty($blockSettings['showLabel'])): ?>
                                    <span class="icon-grid-label"><?php echo esc_html($label); ?></span>
                                <?php endif; ?>
                            <?php else: ?>
                                <div class="icon-grid-wrapper">
                                    <?php if (!empty($svgPath)): ?>
                                        <svg class="icon-grid-wireframe" viewBox="0 0 64 64" aria-label="<?php echo esc_attr($label . ' Icon'); ?>" role="img">
                                            <?php echo icon_grid_sanitize_svg($svgPath); ?>
                                    </svg>
                                    <svg class="icon-grid-gradient" viewBox="0 0 64 64" aria-hidden="true">
                                        <?php echo icon_grid_sanitize_svg($svgPath); ?>
                                    </svg>
                                <?php endif; ?>
                            </div>
                            
                            <span class="icon-grid-label"><?php echo esc_html($label); ?></span>
                            <?php endif; ?>
                            <span class="icon-grid-sr-only"><?php echo esc_html($seoInfo['description'] ?? $label); ?></span>
                        </a>
                <?php 
                    $iconIndex++;
                endif; 
                ?>
            </div>
            <?php
                    else:
                        // Store expansion tile data for later
                        $expansionTiles[] = [
                            'storageIndex' => $storageIndex,
                            'label' => $label,
                            'maxRow' => $maxRow,
                            'maxCol' => $maxCol,
                            // Full grid position for animation rounds lookup
                            'fullGridPosition' => $fullGridPosition,
                            // Calculate position relative to subgrid for absolute positioning
                            'offsetRow' => $maxRow - $subgridStartRow,
                            'offsetCol' => $maxCol - $subgridStartCol
                        ];
                    endif;
                endfor;
            endfor;
            
            // Render expansion tiles with absolute positioning
            if ($enlargeEnabled && !empty($expansionTiles)):
                $expansionPosition = $subgridPosition;
                foreach ($expansionTiles as $tileData):
                    $expansionPosition++;
                    $storageIndex = $tileData['storageIndex'];
                    $label = $tileData['label'];
                    $fullGridPosition = $tileData['fullGridPosition'];
                    $offsetRow = $tileData['offsetRow'];
                    $offsetCol = $tileData['offsetCol'];
                    
                    // Calculate stagger delay based on distance from subgrid center
                    $centerRow = $subgridRows / 2;
                    $centerCol = $subgridCols / 2;
                    $distance = sqrt(pow($offsetRow - $centerRow + 0.5, 2) + pow($offsetCol - $centerCol + 0.5, 2));
                    $staggerDelay = round($distance * 50);
                    
                    // Get per-tile transition settings
                    $tileSettings = $perTileIconSettings[$storageIndex] ?? [];
                    $isTransitionSource = !empty($tileSettings['isTransitionSource']);
                    $transitionId = $tileSettings['transitionId'] ?? '';
                    $transitionScaleExplode = $tileSettings['transitionScaleExplode'] ?? 100;
                    $transitionColorOverride = $tileSettings['transitionColorOverride'] ?? '';
                    $seoUrl = ($attributes['seoData'][$label]['url'] ?? '#');
                    
                    // Build transition data attributes
                    $transitionAttrs = '';
                    if ($isTransitionSource && !empty($label)) {
                        $transitionAttrs = ' data-transition-role="source"';
                        $transitionAttrs .= ' data-transition-id="' . esc_attr($transitionId) . '"';
                        $transitionAttrs .= ' data-transition-link="' . esc_url($seoUrl) . '"';
                        $transitionAttrs .= ' data-transition-scale-explode="' . esc_attr($transitionScaleExplode) . '"';
                        if (!empty($transitionColorOverride)) {
                            $transitionAttrs .= ' data-transition-color="' . esc_attr($transitionColorOverride) . '"';
                        }
                    }
            ?>
                <div class="icon-grid-cell-wrapper expansion-tile<?php echo empty($label) ? ' empty-cell' : ''; ?>" 
                     data-position="<?php echo $expansionPosition; ?>"
                     data-full-grid-position="<?php echo $fullGridPosition; ?>"
                     data-storage-index="<?php echo $storageIndex; ?>"
                     data-expand-delay="<?php echo $staggerDelay; ?>"<?php echo $transitionAttrs; ?>
                     style="--offset-row: <?php echo $offsetRow; ?>; --offset-col: <?php echo $offsetCol; ?>; --subgrid-rows: <?php echo $subgridRows; ?>; --subgrid-cols: <?php echo $subgridCols; ?>; top: calc(var(--offset-row) * ((100% + var(--grid-gap)) / var(--subgrid-rows))); left: calc(var(--offset-col) * ((100% + var(--grid-gap)) / var(--subgrid-cols))); width: calc((100% + var(--grid-gap)) / var(--subgrid-cols) - var(--grid-gap)); height: calc((100% + var(--grid-gap)) / var(--subgrid-rows) - var(--grid-gap));">
                    <?php if (!empty($label)): 
                        $seoInfo = $attributes['seoData'][$label] ?? ['url' => '#', 'description' => $label];
                        $svgPath = $attributes['iconSvgs'][$storageIndex] ?? '';
                        $gradient = $default_gradients[$iconIndex % count($default_gradients)];
                        $gradientId = 'grad-' . $block_id . '-exp-' . $iconIndex;
                        
                        // Check if this is a block-enabled tile
                        $blockSettings = $tileBlockSettings[$storageIndex] ?? ['enabled' => false];
                        $isBlockTile = !empty($blockSettings['enabled']);
                        $blockContent = $tileBlocks[$storageIndex] ?? '';
                        
                        // Build CSS classes for block tiles
                        $cellClasses = 'icon-grid-cell';
                        if ($isBlockTile) {
                            $cellClasses .= ' block-tile';
                            if (!empty($blockSettings['hoverOpacity'])) $cellClasses .= ' hover-opacity';
                            if (!empty($blockSettings['hoverScale'])) $cellClasses .= ' hover-scale';
                        }
                    ?>
                        <a class="<?php echo esc_attr($cellClasses); ?>" 
                           href="<?php echo esc_url($seoInfo['url'] ?? '#'); ?>"
                           title="<?php echo esc_attr($label . ' - Mehr erfahren'); ?>">
                            
                            <div class="icon-grid-cell-bg"></div>
                            
                            <?php if ($isBlockTile && !empty($blockContent)): ?>
                                <div class="block-content">
                                    <?php echo $blockContent; ?>
                                </div>
                                <?php if (!empty($blockSettings['showLabel'])): ?>
                                    <span class="icon-grid-label"><?php echo esc_html($label); ?></span>
                                <?php endif; ?>
                            <?php else: ?>
                                <div class="icon-grid-wrapper">
                                    <?php if (!empty($svgPath)): ?>
                                        <svg class="icon-grid-wireframe" viewBox="0 0 64 64" aria-label="<?php echo esc_attr($label . ' Icon'); ?>" role="img">
                                            <?php echo icon_grid_sanitize_svg($svgPath); ?>
                                    </svg>
                                    <svg class="icon-grid-gradient" viewBox="0 0 64 64" aria-hidden="true">
                                        <defs>
                                            <linearGradient id="<?php echo esc_attr($gradientId); ?>" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" style="stop-color:<?php echo esc_attr($gradient[0]); ?>"/>
                                                <stop offset="100%" style="stop-color:<?php echo esc_attr($gradient[1]); ?>"/>
                                            </linearGradient>
                                        </defs>
                                        <g fill="url(#<?php echo esc_attr($gradientId); ?>)" stroke="none">
                                            <?php echo icon_grid_sanitize_svg($svgPath); ?>
                                        </g>
                                    </svg>
                                <?php endif; ?>
                            </div>
                            
                            <span class="icon-grid-label"><?php echo esc_html($label); ?></span>
                            <?php endif; ?>
                            <span class="icon-grid-sr-only"><?php echo esc_html($seoInfo['description'] ?? $label); ?></span>
                        </a>
                <?php 
                    $iconIndex++;
                endif; 
                ?>
            </div>
            <?php
                endforeach;
            endif;
            ?>
    </div>
    
    <svg class="icon-grid-line-overlay" id="<?php echo esc_attr($block_id); ?>-overlay"></svg>
    </div>
</div>

<?php
// Generate structured data
$structuredData = [
    '@context' => 'https://schema.org',
    '@type' => 'ItemList',
    'itemListElement' => []
];

$position = 1;
foreach ($attributes['seoData'] as $name => $data) {
    if (!empty($data['url'])) {
        $structuredData['itemListElement'][] = [
            '@type' => 'ListItem',
            'position' => $position++,
            'item' => [
                '@type' => 'Service',
                'name' => $name,
                'description' => $data['description'] ?? '',
                'serviceType' => $data['serviceType'] ?? '',
                'url' => $data['url'],
                'provider' => [
                    '@type' => 'Organization',
                    'name' => get_bloginfo('name')
                ]
            ]
        ];
    }
}

if (!empty($structuredData['itemListElement'])):
?>
<script type="application/ld+json">
<?php echo wp_json_encode($structuredData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?>
</script>
<?php endif; ?>

<script>
(function() {
    const blockId = '<?php echo esc_js($block_id); ?>';
    const container = document.getElementById(blockId);
    const gridContainer = container.querySelector('.icon-grid-container');
    const config = JSON.parse(gridContainer.dataset.config);
    
    // Grid dimensions
    const gridRows = parseInt(container.dataset.gridRows) || 6;
    const gridCols = parseInt(container.dataset.gridCols) || 6;
    const totalTiles = gridRows * gridCols;
    
    // Enlarge grid configuration
    const enlargeEnabled = container.dataset.enlargeEnabled === 'true';
    const subgridRows = parseInt(container.dataset.subgridRows) || gridRows;
    const subgridCols = parseInt(container.dataset.subgridCols) || gridCols;
    const subgridStartRow = parseInt(container.dataset.subgridStartRow) || 0;
    const subgridStartCol = parseInt(container.dataset.subgridStartCol) || 0;
    const triggerButton = container.dataset.triggerButton || '';
    const triggerEvent = container.dataset.triggerEvent || '';
    const triggerScroll = parseInt(container.dataset.triggerScroll) || 0;
    
    // Animation configuration
    const CONFIG = config.config;
    const ANIMATION_ROUNDS = config.animationRounds || [];
    const orthoLinesEnabled = config.orthoLinesEnabled !== false;
    
    // State
    let highlightInterval = null;
    let currentlyHighlighted = new Set();
    let currentRoundIndex = 0;
    let isEnlarged = !enlargeEnabled; // Start enlarged if feature is disabled
    
    // Get all cell wrappers
    const allCellWrappers = Array.from(container.querySelectorAll('.icon-grid-cell-wrapper'));
    const lineOverlay = document.getElementById(blockId + '-overlay');
    
    // OPTIMIZATION 1: Pre-build position-to-cell lookup map (eliminates repeated querySelectorAll)
    const positionMap = new Map();
    allCellWrappers.forEach(wrapper => {
        const pos = parseInt(wrapper.dataset.fullGridPosition);
        const cell = wrapper.querySelector('.icon-grid-cell');
        if (pos && cell) positionMap.set(pos, cell);
    });
    
    // OPTIMIZATION 2: Geometry cache for cells (eliminates repeated getBoundingClientRect)
    const geometryCache = new Map();
    let geometryCacheValid = false;
    const wrapperEl = container.querySelector('.icon-grid-wrapper');
    
    function invalidateGeometryCache() {
        geometryCacheValid = false;
        geometryCache.clear();
    }
    
    function rebuildGeometryCache() {
        if (geometryCacheValid) return;
        geometryCache.clear();
        const wrapperRect = wrapperEl.getBoundingClientRect();
        positionMap.forEach((cell, pos) => {
            const rect = cell.getBoundingClientRect();
            const adjustedRect = {
                left: rect.left - wrapperRect.left,
                right: rect.right - wrapperRect.left,
                top: rect.top - wrapperRect.top,
                bottom: rect.bottom - wrapperRect.top,
                width: rect.width,
                height: rect.height
            };
            geometryCache.set(cell, {
                cx: adjustedRect.left + rect.width / 2,
                cy: adjustedRect.top + rect.height / 2,
                rect: adjustedRect
            });
        });
        geometryCacheValid = true;
    }
    
    // Invalidate geometry cache on resize (debounced)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(invalidateGeometryCache, 150);
    }, { passive: true });
    
    // Cache DOM element references on each cell for performance
    allCellWrappers.forEach(wrapper => {
        const cell = wrapper.querySelector('.icon-grid-cell');
        if (cell) {
            cell._cellBg = cell.querySelector('.icon-grid-cell-bg');
            cell._wrapper = cell.querySelector('.icon-grid-wrapper');
            cell._wireframe = cell.querySelector('.icon-grid-wireframe');
            cell._gradient = cell.querySelector('.icon-grid-gradient');
            cell._label = cell.querySelector('.icon-grid-label');
        }
    });
    
    // Helper functions
    // getCellAtPosition uses pre-built position map for O(1) lookup
    function getCellAtPosition(pos) {
        if (pos < 1 || pos > totalTiles) return null;
        return positionMap.get(pos) || null;
    }
    
    // Check if a position (1-based full-grid position) is within the visible subgrid
    function isPositionInSubgrid(pos) {
        if (!enlargeEnabled || isEnlarged) return true; // All positions valid if enlarged or feature disabled
        
        // Convert full-grid position to row/col
        const posZero = pos - 1;
        const row = Math.floor(posZero / gridCols);
        const col = posZero % gridCols;
        
        // Check if this row/col falls within the subgrid region
        const rowInRange = row >= subgridStartRow ? row < subgridStartRow + subgridRows : false;
        const colInRange = col >= subgridStartCol ? col < subgridStartCol + subgridCols : false;
        return rowInRange ? colInRange : false;
    }
    
    // Enlarge grid function - animate expansion tiles with same stagger as entrance
    function enlargeGrid() {
        if (isEnlarged) return; // Already enlarged
        isEnlarged = true;
        container.classList.add('enlarged');
        
        // Get all expansion tiles and animate their cells with random stagger (like entrance)
        const expansionTiles = container.querySelectorAll('.expansion-tile');
        expansionTiles.forEach((tile) => {
            // Make wrapper visible immediately
            tile.style.opacity = '1';
            
            // Animate the cell inside with random stagger like entrance animation
            const cell = tile.querySelector('.icon-grid-cell');
            if (cell) {
                const randomDelay = Math.random() * 1500; // Same as entrance animation (ms)
                anime({
                    targets: cell,
                    opacity: 1,
                    duration: 350,
                    delay: randomDelay,
                    easing: 'easeOutQuad'
                });
            }
        });
        
        console.log('[Icon Grid] Grid enlarged, expansion tiles:', expansionTiles.length);
    }
    
    // Set up enlarge triggers
    if (enlargeEnabled) {
        // Button trigger
        if (triggerButton) {
            const buttons = document.querySelectorAll(triggerButton);
            buttons.forEach(btn => btn.addEventListener('click', enlargeGrid));
        }
        
        // Custom event trigger
        if (triggerEvent) {
            window.addEventListener(triggerEvent, enlargeGrid);
        }
        
        // Scroll trigger
        if (triggerScroll > 0) {
            let scrollTriggered = false;
            window.addEventListener('scroll', () => {
                if (!scrollTriggered && window.scrollY >= triggerScroll) {
                    scrollTriggered = true;
                    enlargeGrid();
                }
            }, { passive: true });
        }
    }
    
    // getCellGeometry uses cached geometry (rebuilt once per round if invalidated)
    function getCellGeometry(cell) {
        rebuildGeometryCache();
        return geometryCache.get(cell) || null;
    }
    
    function getOrthoExitPoint(geom, dx, dy, spreadInfo = null) {
        const { cx, cy, rect } = geom;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        // Straight paths: always exit from center, no spread
        if (absDy < CONFIG.straightThreshold) {
            // Horizontal path - exit from center of side
            return { x: dx > 0 ? rect.right : rect.left, y: cy };
        }
        if (absDx < CONFIG.straightThreshold) {
            // Vertical path - exit from center of top/bottom
            return { x: cx, y: dy > 0 ? rect.bottom : rect.top };
        }
        
        // L-shaped path - apply spread offset for multiple targets in same direction
        // spreadInfo: { index: 0-based position, total: count in this direction }
        let spreadOffset = 0;
        if (spreadInfo && spreadInfo.total > 1) {
            const spreadWidth = Math.min(rect.width * 0.6, spreadInfo.total * CONFIG.turnOffset * 2);
            const step = spreadWidth / (spreadInfo.total - 1);
            spreadOffset = -spreadWidth / 2 + step * spreadInfo.index;
        }
        
        return { x: cx + spreadOffset, y: dy > 0 ? rect.bottom : rect.top };
    }
    
    function getOrthoEntryPoint(geom, dx, dy) {
        const { cx, cy, rect } = geom;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        if (absDy < CONFIG.straightThreshold) {
            // Horizontal path
            return { x: dx > 0 ? rect.left : rect.right, y: cy };
        }
        if (absDx < CONFIG.straightThreshold) {
            // Vertical path
            return { x: cx, y: dy > 0 ? rect.top : rect.bottom };
        }
        // L-shaped path
        return { x: dx > 0 ? rect.left : rect.right, y: cy };
    }
    
    function getDiagonalExitPoint(geom, dx, dy) {
        const { cx, cy, rect } = geom;
        const hw = rect.width / 2;
        const hh = rect.height / 2;
        const ratio = Math.min(hw / Math.abs(dx || 1), hh / Math.abs(dy || 1));
        return { x: cx + dx * ratio * 0.8, y: cy + dy * ratio * 0.8 };
    }
    
    function getDiagonalEntryPoint(geom, dx, dy) {
        const { cx, cy, rect } = geom;
        const hw = rect.width / 2;
        const hh = rect.height / 2;
        const ratio = Math.min(hw / Math.abs(dx || 1), hh / Math.abs(dy || 1));
        return { x: cx - dx * ratio * 0.8, y: cy - dy * ratio * 0.8 };
    }
    
    function buildPathString(start, end, dx, dy, targetCy, useOrtho) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        if (!useOrtho || absDx < CONFIG.straightThreshold || absDy < CONFIG.straightThreshold) {
            return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
        }
        
        const r = Math.min(CONFIG.cornerRadius, absDx / 2, absDy / 2);
        const xDir = dx > 0 ? 1 : -1;
        const yDir = dy > 0 ? 1 : -1;
        
        return `M ${start.x} ${start.y} L ${start.x} ${targetCy - yDir * r} Q ${start.x} ${targetCy} ${start.x + xDir * r} ${targetCy} L ${end.x} ${end.y}`;
    }
    
    function createConnectionLine(fromCell, toCell, spreadInfo = null, useOrtho = orthoLinesEnabled) {
        const fromGeom = getCellGeometry(fromCell);
        const toGeom = getCellGeometry(toCell);
        const dx = toGeom.cx - fromGeom.cx;
        const dy = toGeom.cy - fromGeom.cy;
        
        const start = useOrtho ? getOrthoExitPoint(fromGeom, dx, dy, spreadInfo) : getDiagonalExitPoint(fromGeom, dx, dy);
        const end = useOrtho ? getOrthoEntryPoint(toGeom, dx, dy) : getDiagonalEntryPoint(toGeom, dx, dy);
        
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute('d', buildPathString(start, end, dx, dy, toGeom.cy, useOrtho));
        pathElement.setAttribute('class', 'icon-grid-connecting-line');
        pathElement.style.stroke = CONFIG.lineColor || '#333';
        pathElement.style.strokeWidth = (CONFIG.lineStrokeWidth || 2) + 'px';
        lineOverlay.appendChild(pathElement);
        
        const pathLength = pathElement.getTotalLength();
        pathElement.style.strokeDasharray = pathLength;
        pathElement.style.strokeDashoffset = pathLength;
        
        return { pathElement, pathLength };
    }
    
    // Detect Safari (doesn't handle negative strokeDashoffset well)
    const ua = navigator.userAgent;
    const hasSafari = ua.indexOf('Safari') > -1;
    const hasChrome = ua.indexOf('Chrome') > -1;
    const isSafari = hasSafari ? !hasChrome : false;

    function animateLineIn(connection) {
        anime({
            targets: connection.pathElement,
            strokeDashoffset: 0,
            duration: CONFIG.lineDrawDuration * 1000,
            easing: 'easeInOutQuad',
            round: false
        });
    }
    
    function animateLineOut(connection) {
        // Safari: shrink towards start (positive offset)
        // Chrome/Firefox/Edge: shrink towards end (negative offset)
        const targetOffset = isSafari ? connection.pathLength : -connection.pathLength;
        
        anime({
            targets: connection.pathElement,
            strokeDashoffset: targetOffset,
            duration: CONFIG.lineDrawDuration * 1000,
            easing: 'easeInOutQuad',
            round: false,
            complete: () => {
                connection.pathElement.style.visibility = 'hidden';
            }
        });
    }
    
    function highlightCell(cell) {
        // Skip if user is currently hovering this cell - it's already highlighted
        if (cell.matches(':hover')) return;

        // Use cached DOM references for performance
        const cellBg = cell._cellBg;
        const wrapper = cell._wrapper;
        const wireframe = cell._wireframe;
        const gradient = cell._gradient;
        const label = cell._label;
        
        if (label) label.style.visibility = 'visible';
        
        // Kill any in-progress animations
        anime.remove([cellBg, wrapper, wireframe, gradient]);

        anime({
            targets: cellBg,
            scale: CONFIG.hoverScale || 1.08,
            backgroundColor: CONFIG.hoverBgColor || '#fff',
            boxShadow: `${CONFIG.activeShadowX ?? 0}px ${CONFIG.activeShadowY ?? 8}px ${CONFIG.activeShadowBlur ?? 10}px ${CONFIG.activeShadowSpread ?? 0}px ${CONFIG.activeShadowColor || 'rgba(0,0,0,0.10)'}`,
            borderWidth: 0,
            backdropFilter: CONFIG.hoverGlass ? `blur(${CONFIG.hoverGlassBlur || 10}px)` : (CONFIG.inactiveGlass ? `blur(${CONFIG.inactiveGlassBlur || 10}px)` : 'blur(0px)'),
            duration: CONFIG.cellAnimDuration * 1000,
            easing: 'easeOutBack'
        });
        if (wrapper) anime({ targets: wrapper, translateY: (CONFIG.hoverSlideAmount || -10) + '%', duration: CONFIG.cellAnimDuration * 1000, easing: 'easeOutBack' });
        if (wireframe) anime({ targets: wireframe, opacity: 0, duration: CONFIG.cellAnimDuration * 1000, easing: 'easeOutQuad' });
        if (gradient) anime({ targets: gradient, opacity: 1, duration: CONFIG.cellAnimDuration * 1000, easing: 'easeOutQuad' });
    }
    
    function unhighlightCell(cell) {
        // Skip if user is currently hovering this cell - let mouseleave handle it
        if (cell.matches(':hover')) return;
        
        // Use cached DOM references for performance
        const cellBg = cell._cellBg;
        const wrapper = cell._wrapper;
        const wireframe = cell._wireframe;
        const gradient = cell._gradient;
        const label = cell._label;
        
        if (label) label.style.visibility = '';
        
        // Kill any in-progress animations
        anime.remove([cellBg, wrapper, wireframe, gradient]);
        
        anime({
            targets: cellBg,
            scale: 1,
            backgroundColor: CONFIG.inactiveBgColor || (CONFIG.inactiveGlass ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0)'),
            boxShadow: '0 0 0 0 rgba(0,0,0,0)',
            borderWidth: 1,
            backdropFilter: CONFIG.inactiveGlass ? `blur(${CONFIG.inactiveGlassBlur || 10}px)` : 'blur(0px)',
            duration: CONFIG.cellAnimDuration * 1000,
            easing: 'easeInOutQuad'
        });
        if (wrapper) anime({ targets: wrapper, translateY: '0%', duration: CONFIG.cellAnimDuration * 1000, easing: 'easeInOutQuad' });
        if (wireframe) anime({ targets: wireframe, opacity: 1, duration: CONFIG.cellAnimDuration * 1000, easing: 'easeOutQuad' });
        if (gradient) anime({ targets: gradient, opacity: 0, duration: CONFIG.cellAnimDuration * 1000, easing: 'easeOutQuad' });
    }
    
    function playNextRound() {
        if (ANIMATION_ROUNDS.length === 0) return;
        
        currentlyHighlighted.forEach(unhighlightCell);
        currentlyHighlighted = new Set();
        lineOverlay.innerHTML = '';
        
        const round = ANIMATION_ROUNDS[currentRoundIndex];
        currentRoundIndex = (currentRoundIndex + 1) % ANIMATION_ROUNDS.length;
        
        const allSourceCells = new Set();
        const allTargetCells = new Set();
        const allConnections = [];
        
        round.forEach((group, groupIndex) => {
            const staggerDelay = groupIndex * CONFIG.groupStaggerDelay;
            
            const useDiagonal = group[group.length - 1] === 'd';
            const positions = useDiagonal ? group.slice(0, -1) : group;
            const useOrtho = useDiagonal ? false : orthoLinesEnabled;
            
            // Skip groups that reference tiles outside the visible subgrid (before enlarge)
            if (!positions.every(pos => isPositionInSubgrid(pos))) {
                return; // Skip this group
            }
            
            const sourceCell = getCellAtPosition(positions[0]);
            // Collect ALL target cells (positions[1] through positions[n])
            const targetCells = positions.slice(1).map(pos => getCellAtPosition(pos));
            
            if (!sourceCell || targetCells.length === 0 || targetCells.some(c => !c)) return;
            
            // Calculate spread info for each target based on directional grouping
            const sourceGeom = getCellGeometry(sourceCell);
            const targetGeoms = targetCells.map(cell => getCellGeometry(cell));
            
            // Calculate deltas and categorize by direction
            const deltas = targetGeoms.map(geom => ({
                dx: geom.cx - sourceGeom.cx,
                dy: geom.cy - sourceGeom.cy
            }));
            
            // Group targets by vertical direction (up vs down)
            const upTargets = deltas.map((d, i) => d.dy < 0 ? i : -1).filter(i => i >= 0);
            const downTargets = deltas.map((d, i) => d.dy > 0 ? i : -1).filter(i => i >= 0);
            const horizontalTargets = deltas.map((d, i) => Math.abs(d.dy) < CONFIG.straightThreshold ? i : -1).filter(i => i >= 0);
            
            // Sort each group by X position for consistent ordering (left to right)
            upTargets.sort((a, b) => deltas[a].dx - deltas[b].dx);
            downTargets.sort((a, b) => deltas[a].dx - deltas[b].dx);
            horizontalTargets.sort((a, b) => deltas[a].dy - deltas[b].dy);
            
            // Create spreadInfo for each target
            const spreadInfos = targetCells.map((_, i) => {
                // Find which group this target belongs to and its position within
                let group, indexInGroup;
                if (upTargets.includes(i)) {
                    group = upTargets;
                    indexInGroup = upTargets.indexOf(i);
                } else if (downTargets.includes(i)) {
                    group = downTargets;
                    indexInGroup = downTargets.indexOf(i);
                } else {
                    group = horizontalTargets;
                    indexInGroup = horizontalTargets.indexOf(i);
                }
                return { index: indexInGroup, total: group.length };
            });
            
            const connections = targetCells.map((target, i) =>
                createConnectionLine(sourceCell, target, spreadInfos[i], useOrtho)
            );
            
            allSourceCells.add(sourceCell);
            targetCells.forEach(c => allTargetCells.add(c));
            allConnections.push(...connections);
            
            setTimeout(() => {
                if (!currentlyHighlighted.has(sourceCell)) {
                    highlightCell(sourceCell);
                    currentlyHighlighted.add(sourceCell);
                }
                connections.forEach(animateLineIn);
                
                setTimeout(() => {
                    targetCells.forEach(cell => {
                        if (!currentlyHighlighted.has(cell)) {
                            highlightCell(cell);
                            currentlyHighlighted.add(cell);
                        }
                    });
                }, CONFIG.lineDrawDuration * 1000);
            }, staggerDelay);
        });
        
        setTimeout(() => {
            allSourceCells.forEach(unhighlightCell);
            allConnections.forEach(animateLineOut);
            
            setTimeout(() => {
                allTargetCells.forEach(unhighlightCell);
                currentlyHighlighted = new Set();
                allConnections.forEach(c => c.pathElement.remove());
            }, CONFIG.lineDrawDuration * 1000);
        }, CONFIG.highlightDuration);
    }
    
    // Entrance animation - only animate subgrid cells, not expansion tiles
    function playEntranceAnimation() {
        // Select only cells that are NOT inside expansion tiles
        const cells = Array.from(container.querySelectorAll('.icon-grid-cell-wrapper:not(.expansion-tile) .icon-grid-cell'));
        cells.forEach(cell => {
            const randomDelay = Math.random() * 1500;
            anime({
                targets: cell,
                opacity: 1,
                duration: 350,
                delay: randomDelay,
                easing: 'easeOutQuad'
            });
        });
        
        // Initialize glassmorphism by calling unhighlightCell on all cells after entrance animation
        // This mimics what happens after a round animation ends, which properly applies backdrop-filter
        setTimeout(() => {
            cells.forEach(unhighlightCell);
        }, 1900); // After max stagger delay (1500) + animation duration (350) + buffer
        
        setTimeout(() => {
            playNextRound();
            // Apply transition offset: negative = overlap (next starts early), positive = delay
            const effectiveInterval = CONFIG.loopInterval + (CONFIG.transitionOffset || 0);
            highlightInterval = setInterval(playNextRound, Math.max(100, effectiveInterval));
        }, CONFIG.startupDelay ?? 2000); // Delay after entrance animation before rounds start
    }
    
    // Hover animations - use cached DOM references
    container.querySelectorAll('.icon-grid-cell').forEach(cell => {
        const cellBg = cell._cellBg;
        const wrapper = cell._wrapper;
        const wireframe = cell._wireframe;
        const gradient = cell._gradient;
        const label = cell._label;
        
        cell.addEventListener('mouseenter', () => {
            // Skip if already highlighted by animation - prevents double box-shadow
            if (currentlyHighlighted.has(cell)) return;
            
            // Kill any in-progress animations to prevent conflicts
            anime.remove([cellBg, wrapper, wireframe, gradient]);
            
            anime({ 
                targets: cellBg, 
                scale: CONFIG.hoverScale || 1.08, 
                backgroundColor: CONFIG.hoverBgColor || '#fff', 
                boxShadow: `${CONFIG.activeShadowX ?? 0}px ${CONFIG.activeShadowY ?? 8}px ${CONFIG.activeShadowBlur ?? 10}px ${CONFIG.activeShadowSpread ?? 0}px ${CONFIG.activeShadowColor || 'rgba(0,0,0,0.10)'}`, 
                borderWidth: 0, 
                backdropFilter: CONFIG.hoverGlass ? `blur(${CONFIG.hoverGlassBlur || 10}px)` : (CONFIG.inactiveGlass ? `blur(${CONFIG.inactiveGlassBlur || 10}px)` : 'blur(0px)'),
                duration: 300, 
                easing: 'easeOutBack' 
            });
            if (wrapper) anime({ targets: wrapper, translateY: (CONFIG.hoverSlideAmount || -10) + '%', duration: 300, easing: 'easeOutBack' });
            if (wireframe) anime({ targets: wireframe, opacity: 0, duration: 250, easing: 'easeOutQuad' });
            if (gradient) anime({ targets: gradient, opacity: 1, duration: 250, easing: 'easeOutQuad' });
            if (label) label.style.visibility = 'visible';
        });
        
        cell.addEventListener('mouseleave', () => {
            if (currentlyHighlighted.has(cell)) return;
            
            // Kill any in-progress animations to prevent conflicts
            anime.remove([cellBg, wrapper, wireframe, gradient]);
            
            anime({ 
                targets: cellBg, 
                scale: 1, 
                backgroundColor: CONFIG.inactiveBgColor || (CONFIG.inactiveGlass ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0)'), 
                boxShadow: '0 0 0 0 rgba(0,0,0,0)', 
                borderWidth: 1, 
                backdropFilter: CONFIG.inactiveGlass ? `blur(${CONFIG.inactiveGlassBlur || 10}px)` : 'blur(0px)',
                duration: 250, 
                easing: 'easeOutQuad' 
            });
            if (wrapper) anime({ targets: wrapper, translateY: '0%', duration: 250, easing: 'easeOutQuad' });
            if (wireframe) anime({ targets: wireframe, opacity: 1, duration: 250, easing: 'easeOutQuad' });
            if (gradient) anime({ targets: gradient, opacity: 0, duration: 250, easing: 'easeOutQuad' });
            if (label) label.style.visibility = '';
        });
    });
    
    // Use Intersection Observer to trigger entrance animation when grid enters viewport
    let hasAnimated = false;
    
    function startAnimation() {
        if (hasAnimated) return;
        hasAnimated = true;
        
        // Wait for anime.js to be available (it's loaded in footer)
        function waitForAnime() {
            if (typeof anime !== 'undefined') {
                playEntranceAnimation();
            } else {
                // Poll every 50ms for anime.js to load
                setTimeout(waitForAnime, 50);
            }
        }
        waitForAnime();
    }
    
    function pauseAnimation() {
        if (highlightInterval) {
            clearInterval(highlightInterval);
            highlightInterval = null;
        }
    }
    
    function resumeAnimation() {
        if (!highlightInterval && hasAnimated) {
            // Resume immediately with next round
            playNextRound();
            const effectiveInterval = CONFIG.loopInterval + (CONFIG.transitionOffset || 0);
            highlightInterval = setInterval(playNextRound, Math.max(100, effectiveInterval));
        }
    }
    
    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!hasAnimated) {
                        startAnimation();
                    } else {
                        resumeAnimation();
                    }
                } else {
                    // Pause when out of view to save resources
                    pauseAnimation();
                }
            });
        }, {
            threshold: 0.1 // Trigger when 10% visible
        });
        
        observer.observe(container);
    } else {
        // Fallback for older browsers - just start immediately
        startAnimation();
    }
    
    // Dynamic vertical centering with debounce
    if (container.dataset.centerVertically === 'true') {
        // Debounce helper
        function debounce(fn, delay) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => fn.apply(this, args), delay);
            };
        }
        
        // Get target element (from selector or default to container)
        const targetSelector = container.dataset.centerTarget;
        const targetElement = targetSelector ? document.querySelector(targetSelector) : container;
        
        if (!targetElement) {
            console.warn('Icon Grid: Center target selector not found:', targetSelector);
            return;
        }
        
        function updateVerticalCenter() {
            // Use grid height for calculation (even if targeting parent)
            const gridHeight = container.offsetHeight;
            const viewportHeight = window.innerHeight;
            const offset = Math.max(0, (viewportHeight - gridHeight) / 2);
            targetElement.style.top = offset + 'px';
        }
        
        // Debounced version for resize events
        const debouncedUpdate = debounce(updateVerticalCenter, 100);
        
        // Initial calculation
        updateVerticalCenter();
        
        // Watch for viewport resize
        window.addEventListener('resize', debouncedUpdate);
        
        // Watch for grid size changes
        if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(debouncedUpdate);
            resizeObserver.observe(container);
        }
    }
})();
</script>
