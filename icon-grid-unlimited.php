<?php
/**
 * Plugin Name: Icon Grid Unlimited
 * Description: Animated icon grid with configurable size up to 12x12, connections and SEO features
 * Version: 1.3.0
 * Author: EXZENT Webdesign
 * Text Domain: icon-grid-unlimited
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register the block
 */
function icon_grid_unlimited_init() {
    register_block_type(__DIR__ . '/build/grid', [
        'render_callback' => 'icon_grid_unlimited_render'
    ]);

    register_block_type(__DIR__ . '/build/helper', [
        'render_callback' => 'icon_grid_unlimited_render_helper'
    ]);
}
add_action('init', 'icon_grid_unlimited_init');

/**
 * Enqueue anime.js for frontend (MIT licensed, ~17KB vs GSAP's 60KB)
 */
function icon_grid_unlimited_enqueue_assets() {
    if (has_block('icon-grid-unlimited/icon-grid') || has_block('icon-grid-unlimited/icon-grid-helper')) {
        wp_enqueue_script(
            'animejs',
            'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js',
            [],
            '3.2.2',
            true
        );
    }
}
add_action('wp_enqueue_scripts', 'icon_grid_unlimited_enqueue_assets');

/**
 * Render the block on frontend
 */
function icon_grid_unlimited_render($attributes, $content, $block) {
    // Default values
    $defaults = [
        'gridRows' => 6,
        'gridCols' => 6,
        'config' => [
            'lineDrawDuration' => 0.5,
            'highlightDuration' => 1999,
            'loopInterval' => 3000,
            'cellAnimDuration' => 0.4,
            'groupStaggerDelay' => 150,
            'turnOffset' => 8,
            'cornerRadius' => 20,
            'straightThreshold' => 5,
            'inactiveBorderWidth' => 1
        ],
        'animationRounds' => [],
        'iconLabels' => array_fill(0, 144, ''),
        'seoData' => [],
        'iconSvgs' => array_fill(0, 144, ''),
        'orthoLinesEnabled' => true
    ];
    
    $attributes = wp_parse_args($attributes, $defaults);
    
    // Generate unique ID for this block instance
    $block_id = 'icon-grid-' . uniqid();
    
    // Only pass animation-relevant config to JavaScript (not iconLabels, iconSvgs, seoData which are in HTML)
    $minimal_config = [
        'config' => $attributes['config'],
        'animationRounds' => $attributes['animationRounds'],
        'orthoLinesEnabled' => $attributes['orthoLinesEnabled'] ?? true
    ];
    $config_json = wp_json_encode($minimal_config);
    
    ob_start();
    include __DIR__ . '/includes/render.php';
    return ob_get_clean();
}

/**
 * Render the helper block on frontend
 */
function icon_grid_unlimited_render_helper($attributes, $content) {
    ob_start();
    include __DIR__ . '/includes/render-helper.php';
    return ob_get_clean();
}
