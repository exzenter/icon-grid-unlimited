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
$inactiveBorderWidth = $attributes['config']['inactiveBorderWidth'] ?? 1;
$inactiveStrokeColor = $attributes['config']['inactiveStrokeColor'] ?? '#333333';
$inactiveStrokeWidth = $attributes['config']['inactiveStrokeWidth'] ?? 1.5;
$nonScalingStroke = $attributes['config']['nonScalingStroke'] ?? true;
$shapeRendering = $attributes['config']['shapeRendering'] ?? 'auto';
$iconOffsetX = $attributes['config']['iconOffsetX'] ?? 0;
$iconOffsetY = $attributes['config']['iconOffsetY'] ?? 0;
$gridGap = $attributes['config']['gridGap'] ?? '0.5rem';
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
            --grid-gap: <?php echo esc_attr($gridGap); ?>;
            grid-template-columns: repeat(<?php echo esc_attr($visibleCols); ?>, 1fr);
            position: relative;
            <?php if ($enlargeEnabled): ?>overflow: visible;<?php endif; ?>
        }
        #<?php echo esc_attr($block_id); ?> .icon-grid-cell-bg {
            border-color: <?php echo esc_attr($inactiveBorderColor); ?>;
            border-width: <?php echo esc_attr($inactiveBorderWidth); ?>px;
            border-style: solid;
            border-radius: <?php echo esc_attr($tileBorderRadius); ?>px;
            background: <?php echo esc_attr($inactiveBgColor); ?>;
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
            <?php if ($nonScalingStroke): ?>vector-effect: non-scaling-stroke;<?php endif; ?>
            <?php if ($shapeRendering !== 'auto'): ?>shape-rendering: <?php echo esc_attr($shapeRendering); ?>;<?php endif; ?>
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

