<?php
/**
 * Icon Grid Helper Block - Frontend Render
 * 
 * @var array $attributes Block attributes
 * @var string $content Block content
 */

$transitionId = $attributes['transitionId'] ?? '';
$transitionAttrs = '';

if (!empty($transitionId)) {
    $transitionAttrs = ' data-transition-target="' . esc_attr($transitionId) . '"';
}

$wrapper_attributes = get_block_wrapper_attributes([
    'class' => 'icon-grid-helper',
]);
?>

<div <?php echo $wrapper_attributes; ?><?php echo $transitionAttrs; ?>>
    <?php echo $content; ?>
</div>
