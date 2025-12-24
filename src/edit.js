/**
 * Icon Grid Block - Editor Component
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
    PanelBody,
    RangeControl,
    ToggleControl,
    TextControl,
    TextareaControl,
    Button,
    Modal,
    Flex,
    FlexItem,
    __experimentalGrid as Grid,
    Card,
    CardBody,
    TabPanel,
    ColorPicker,
    ColorIndicator,
    Dropdown,
    __experimentalVStack as VStack
} from '@wordpress/components';
import { useState } from '@wordpress/element';

// Reusable popup color picker component
const PopupColorPicker = ({ label, color, onChange }) => (
    <Flex align="center" style={{ marginBottom: '12px' }}>
        <FlexItem>
            <span style={{ fontWeight: '500' }}>{label}</span>
        </FlexItem>
        <FlexItem>
            <Dropdown
                renderToggle={({ isOpen, onToggle }) => (
                    <Button onClick={onToggle} aria-expanded={isOpen} style={{ padding: '4px' }}>
                        <ColorIndicator colorValue={color} />
                    </Button>
                )}
                renderContent={() => (
                    <ColorPicker
                        color={color}
                        onChange={onChange}
                        enableAlpha={true}
                    />
                )}
            />
        </FlexItem>
    </Flex>
);


export default function Edit({ attributes, setAttributes }) {
    const {
        gridRows,
        gridCols,
        enlargeEnabled,
        subgridRows,
        subgridCols,
        subgridStartRow,
        subgridStartCol,
        enlargeTriggerButton,
        enlargeTriggerEvent,
        enlargeTriggerScroll,
        tileBlockSettings,
        tileBlocks,
        config,
        animationRounds,
        iconLabels,
        seoData,
        iconSvgs,
        perTileIconSettings,
        orthoLinesEnabled,
        stickyEnabled,
        stickyOffset
    } = attributes;

    const [isGridModalOpen, setGridModalOpen] = useState(false);
    const [isRoundsModalOpen, setRoundsModalOpen] = useState(false);
    const [selectedTile, setSelectedTile] = useState(null);
    const [roundsText, setRoundsText] = useState(JSON.stringify(animationRounds, null, 2));
    const [dragFromTile, setDragFromTile] = useState(null);

    const blockProps = useBlockProps({
        className: 'icon-grid-unlimited-editor'
    });

    // Update config value
    const updateConfig = (key, value) => {
        setAttributes({
            config: { ...config, [key]: value }
        });
    };

    // Update icon label at index
    const updateLabel = (index, value) => {
        const newLabels = [...iconLabels];
        newLabels[index] = value;
        setAttributes({ iconLabels: newLabels });
    };

    // Update SVG at index
    const updateSvg = (index, value) => {
        const newSvgs = [...iconSvgs];
        newSvgs[index] = value;
        setAttributes({ iconSvgs: newSvgs });
    };

    // Update SEO data for a label
    const updateSeoData = (label, field, value) => {
        const newSeoData = { ...seoData };
        if (!newSeoData[label]) {
            newSeoData[label] = { url: '', description: '', serviceType: '' };
        }
        newSeoData[label][field] = value;
        setAttributes({ seoData: newSeoData });
    };

    // Update per-tile icon settings
    const updatePerTileSettings = (index, field, value) => {
        const newSettings = { ...perTileIconSettings };
        if (!newSettings[index]) {
            newSettings[index] = { enabled: false, offsetX: 0, offsetY: 0, scale: 1 };
        }
        newSettings[index][field] = value;
        setAttributes({ perTileIconSettings: newSettings });
    };

    // Update tile block settings (enable block, hover options, etc.)
    const updateTileBlockSettings = (index, field, value) => {
        const newSettings = { ...tileBlockSettings };
        if (!newSettings[index]) {
            newSettings[index] = { enabled: false, hoverOpacity: true, hoverScale: false, showLabel: true };
        }
        newSettings[index][field] = value;
        setAttributes({ tileBlockSettings: newSettings });
    };

    // Update tile block content (serialized HTML)
    const updateTileBlock = (index, content) => {
        const newBlocks = { ...tileBlocks };
        newBlocks[index] = content;
        setAttributes({ tileBlocks: newBlocks });
    };

    // Get tile block settings with defaults
    const getTileBlockSettings = (index) => {
        return tileBlockSettings[index] || { enabled: false, hoverOpacity: true, hoverScale: false, showLabel: true };
    };

    // Move all settings from one tile to another (for drag-and-drop)
    const moveTileSettings = (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;

        // Copy labels
        const newLabels = [...iconLabels];
        newLabels[toIndex] = iconLabels[fromIndex] || '';
        newLabels[fromIndex] = '';

        // Copy SVGs
        const newSvgs = [...iconSvgs];
        newSvgs[toIndex] = iconSvgs[fromIndex] || '';
        newSvgs[fromIndex] = '';

        // Copy perTileIconSettings
        const newPerTileSettings = { ...perTileIconSettings };
        if (perTileIconSettings[fromIndex]) {
            newPerTileSettings[toIndex] = { ...perTileIconSettings[fromIndex] };
            delete newPerTileSettings[fromIndex];
        } else {
            delete newPerTileSettings[toIndex];
        }

        // Copy tileBlockSettings
        const newBlockSettings = { ...tileBlockSettings };
        if (tileBlockSettings[fromIndex]) {
            newBlockSettings[toIndex] = { ...tileBlockSettings[fromIndex] };
            delete newBlockSettings[fromIndex];
        } else {
            delete newBlockSettings[toIndex];
        }

        // Copy tileBlocks content
        const newBlocks = { ...tileBlocks };
        if (tileBlocks[fromIndex]) {
            newBlocks[toIndex] = tileBlocks[fromIndex];
            delete newBlocks[fromIndex];
        } else {
            delete newBlocks[toIndex];
        }

        // Update all at once
        setAttributes({
            iconLabels: newLabels,
            iconSvgs: newSvgs,
            perTileIconSettings: newPerTileSettings,
            tileBlockSettings: newBlockSettings,
            tileBlocks: newBlocks
        });
    };

    // Parse and save animation rounds
    const saveRounds = () => {
        try {
            const parsed = JSON.parse(roundsText);
            setAttributes({ animationRounds: parsed });
            setRoundsModalOpen(false);
        } catch (e) {
            alert(__('Invalid JSON format', 'icon-grid-unlimited'));
        }
    };

    // Grid position helper - now uses dynamic gridCols
    const getGridPosition = (index) => {
        const row = Math.floor(index / gridCols) + 1;
        const col = (index % gridCols) + 1;
        return `${row}-${col}`;
    };

    // Check if a tile index is within the current grid bounds
    const isTileInBounds = (index) => {
        const row = Math.floor(index / 12); // Always use 12 cols for storage layout
        const col = index % 12;
        return row < gridRows && col < gridCols;
    };

    // Get the tile index from row/col in the 12-column storage layout
    const getTileIndex = (row, col) => row * 12 + col;

    // Total tiles in current grid
    const totalTilesInGrid = gridRows * gridCols;

    return (
        <>
            <InspectorControls>
                {/* Grid Size Control */}
                <PanelBody title={__('Grid Size', 'icon-grid-unlimited')} initialOpen={true}>
                    <Flex gap={4}>
                        <FlexItem style={{ flex: 1 }}>
                            <RangeControl
                                label={__('Max Rows', 'icon-grid-unlimited')}
                                value={gridRows}
                                onChange={(v) => setAttributes({ gridRows: v })}
                                min={1}
                                max={12}
                                step={1}
                            />
                        </FlexItem>
                        <FlexItem style={{ flex: 1 }}>
                            <RangeControl
                                label={__('Max Cols', 'icon-grid-unlimited')}
                                value={gridCols}
                                onChange={(v) => setAttributes({ gridCols: v })}
                                min={1}
                                max={12}
                                step={1}
                            />
                        </FlexItem>
                    </Flex>
                    <p style={{ textAlign: 'center', margin: '8px 0 0', color: '#666', fontSize: '13px' }}>
                        {gridRows} × {gridCols} = {totalTilesInGrid} {__('tiles', 'icon-grid-unlimited')}
                    </p>

                    <hr style={{ margin: '20px 0', borderColor: '#ddd' }} />

                    <ToggleControl
                        label={__('Enlarge Grid After Event', 'icon-grid-unlimited')}
                        checked={enlargeEnabled}
                        onChange={(v) => setAttributes({ enlargeEnabled: v })}
                        help={__('Show a subgrid initially, expand to full grid on trigger', 'icon-grid-unlimited')}
                    />

                    {enlargeEnabled && (
                        <>
                            <p style={{ marginTop: '15px', fontWeight: '500', fontSize: '12px', color: '#1e1e1e' }}>
                                {__('Subgrid Size', 'icon-grid-unlimited')}
                            </p>
                            <Flex gap={4}>
                                <FlexItem style={{ flex: 1 }}>
                                    <RangeControl
                                        label={__('Rows', 'icon-grid-unlimited')}
                                        value={subgridRows}
                                        onChange={(v) => setAttributes({ subgridRows: Math.min(v, gridRows - subgridStartRow) })}
                                        min={1}
                                        max={gridRows}
                                        step={1}
                                    />
                                </FlexItem>
                                <FlexItem style={{ flex: 1 }}>
                                    <RangeControl
                                        label={__('Cols', 'icon-grid-unlimited')}
                                        value={subgridCols}
                                        onChange={(v) => setAttributes({ subgridCols: Math.min(v, gridCols - subgridStartCol) })}
                                        min={1}
                                        max={gridCols}
                                        step={1}
                                    />
                                </FlexItem>
                            </Flex>

                            <p style={{ marginTop: '10px', fontWeight: '500', fontSize: '12px', color: '#1e1e1e' }}>
                                {__('Subgrid Start Position', 'icon-grid-unlimited')}
                            </p>
                            <Flex gap={4}>
                                <FlexItem style={{ flex: 1 }}>
                                    <RangeControl
                                        label={__('Start Row', 'icon-grid-unlimited')}
                                        value={subgridStartRow}
                                        onChange={(v) => setAttributes({ subgridStartRow: v })}
                                        min={0}
                                        max={Math.max(0, gridRows - subgridRows)}
                                        step={1}
                                    />
                                </FlexItem>
                                <FlexItem style={{ flex: 1 }}>
                                    <RangeControl
                                        label={__('Start Col', 'icon-grid-unlimited')}
                                        value={subgridStartCol}
                                        onChange={(v) => setAttributes({ subgridStartCol: v })}
                                        min={0}
                                        max={Math.max(0, gridCols - subgridCols)}
                                        step={1}
                                    />
                                </FlexItem>
                            </Flex>

                            {/* Visual Grid Preview */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                                gap: '2px',
                                marginTop: '15px',
                                padding: '10px',
                                background: '#f0f0f0',
                                borderRadius: '4px'
                            }}>
                                {Array.from({ length: gridRows * gridCols }, (_, i) => {
                                    const row = Math.floor(i / gridCols);
                                    const col = i % gridCols;
                                    const isInSubgrid = row >= subgridStartRow && row < subgridStartRow + subgridRows
                                        && col >= subgridStartCol && col < subgridStartCol + subgridCols;
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                width: '16px',
                                                height: '16px',
                                                background: isInSubgrid ? '#007cba' : '#ccc',
                                                borderRadius: '2px',
                                                opacity: isInSubgrid ? 1 : 0.4
                                            }}
                                            title={isInSubgrid ? 'Subgrid (visible)' : 'Expansion (hidden)'}
                                        />
                                    );
                                })}
                            </div>
                            <p style={{ textAlign: 'center', fontSize: '11px', color: '#666', marginTop: '5px' }}>
                                {__('Blue = Subgrid (visible), Grey = Expansion tiles', 'icon-grid-unlimited')}
                            </p>

                            <p style={{ marginTop: '15px', fontWeight: '500', fontSize: '12px', color: '#1e1e1e' }}>
                                {__('Trigger Options', 'icon-grid-unlimited')}
                            </p>
                            <TextControl
                                label={__('Button Selector', 'icon-grid-unlimited')}
                                value={enlargeTriggerButton}
                                onChange={(v) => setAttributes({ enlargeTriggerButton: v })}
                                placeholder="#expand-btn, .trigger-class"
                                help={__('CSS selector for button that triggers expansion', 'icon-grid-unlimited')}
                            />
                            <TextControl
                                label={__('Custom Event Name', 'icon-grid-unlimited')}
                                value={enlargeTriggerEvent}
                                onChange={(v) => setAttributes({ enlargeTriggerEvent: v })}
                                placeholder="enlargeGrid"
                                help={__('Window event name to listen for', 'icon-grid-unlimited')}
                            />
                            <RangeControl
                                label={__('Scroll Position (px)', 'icon-grid-unlimited')}
                                value={enlargeTriggerScroll}
                                onChange={(v) => setAttributes({ enlargeTriggerScroll: v })}
                                min={0}
                                max={5000}
                                step={50}
                                help={__('Expand when scrolled past this position (0 = disabled)', 'icon-grid-unlimited')}
                            />
                        </>
                    )}
                </PanelBody>

                {/* Timing Settings */}
                <PanelBody title={__('Timing Settings', 'icon-grid-unlimited')} initialOpen={false}>
                    <RangeControl
                        label={__('Line Draw Duration (s)', 'icon-grid-unlimited')}
                        value={config.lineDrawDuration}
                        onChange={(v) => updateConfig('lineDrawDuration', v)}
                        min={0.1}
                        max={2}
                        step={0.001}
                    />
                    <RangeControl
                        label={__('Highlight Duration (ms)', 'icon-grid-unlimited')}
                        value={config.highlightDuration}
                        onChange={(v) => updateConfig('highlightDuration', v)}
                        min={100}
                        max={10000}
                        step={1}
                    />
                    <RangeControl
                        label={__('Loop Interval (ms)', 'icon-grid-unlimited')}
                        value={config.loopInterval}
                        onChange={(v) => updateConfig('loopInterval', v)}
                        min={100}
                        max={20000}
                        step={1}
                    />
                    <RangeControl
                        label={__('Cell Animation Duration (s)', 'icon-grid-unlimited')}
                        value={config.cellAnimDuration}
                        onChange={(v) => updateConfig('cellAnimDuration', v)}
                        min={0.01}
                        max={2}
                        step={0.001}
                    />
                    <RangeControl
                        label={__('Group Stagger Delay (ms)', 'icon-grid-unlimited')}
                        value={config.groupStaggerDelay}
                        onChange={(v) => updateConfig('groupStaggerDelay', v)}
                        min={0}
                        max={1000}
                        step={1}
                    />
                    <RangeControl
                        label={__('Transition Offset (ms)', 'icon-grid-unlimited')}
                        value={config.transitionOffset || 0}
                        onChange={(v) => updateConfig('transitionOffset', v)}
                        min={-3000}
                        max={3000}
                        step={50}
                        help={__('Negative = next round starts early (overlap), Positive = delay between rounds', 'icon-grid-unlimited')}
                    />
                    <RangeControl
                        label={__('Startup Animation Delay (ms)', 'icon-grid-unlimited')}
                        value={config.startupDelay ?? 2000}
                        onChange={(v) => updateConfig('startupDelay', v)}
                        min={0}
                        max={3000}
                        step={50}
                        help={__('Delay after entrance animation before connection rounds start', 'icon-grid-unlimited')}
                    />
                </PanelBody>

                {/* Line Settings */}
                <PanelBody title={__('Line Settings', 'icon-grid-unlimited')} initialOpen={false}>
                    <PopupColorPicker
                        label={__('Line Color', 'icon-grid-unlimited')}
                        color={config.lineColor || '#333333'}
                        onChange={(color) => updateConfig('lineColor', color)}
                    />
                    <RangeControl
                        label={__('Line Stroke Width (px)', 'icon-grid-unlimited')}
                        value={config.lineStrokeWidth || 2}
                        onChange={(v) => updateConfig('lineStrokeWidth', v)}
                        min={0.5}
                        max={10}
                        step={0.5}
                    />
                    <RangeControl
                        label={__('Turn Offset (px)', 'icon-grid-unlimited')}
                        value={config.turnOffset}
                        onChange={(v) => updateConfig('turnOffset', v)}
                        min={0}
                        max={20}
                        step={1}
                    />
                    <RangeControl
                        label={__('Corner Radius (px)', 'icon-grid-unlimited')}
                        value={config.cornerRadius}
                        onChange={(v) => updateConfig('cornerRadius', v)}
                        min={0}
                        max={50}
                        step={1}
                    />
                </PanelBody>

                {/* Icon Style Settings */}
                <PanelBody title={__('Icon Style', 'icon-grid-unlimited')} initialOpen={false}>
                    <RangeControl
                        label={__('Icon Scale', 'icon-grid-unlimited')}
                        value={config.iconScale || 1}
                        onChange={(v) => updateConfig('iconScale', v)}
                        min={0.5}
                        max={2}
                        step={0.05}
                    />
                    <RangeControl
                        label={__('Icon X Offset (%)', 'icon-grid-unlimited')}
                        value={config.iconOffsetX || 0}
                        onChange={(v) => updateConfig('iconOffsetX', v)}
                        min={-50}
                        max={50}
                        step={1}
                    />
                    <RangeControl
                        label={__('Icon Y Offset (%)', 'icon-grid-unlimited')}
                        value={config.iconOffsetY || 0}
                        onChange={(v) => updateConfig('iconOffsetY', v)}
                        min={-50}
                        max={50}
                        step={1}
                    />
                    <PopupColorPicker
                        label={__('Inactive Border Color', 'icon-grid-unlimited')}
                        color={config.inactiveBorderColor || '#00000031'}
                        onChange={(color) => updateConfig('inactiveBorderColor', color)}
                    />
                    <PopupColorPicker
                        label={__('Inactive Stroke Color', 'icon-grid-unlimited')}
                        color={config.inactiveStrokeColor || '#333333'}
                        onChange={(color) => updateConfig('inactiveStrokeColor', color)}
                    />
                    <RangeControl
                        label={__('Inactive Stroke Width', 'icon-grid-unlimited')}
                        value={config.inactiveStrokeWidth || 1.5}
                        onChange={(v) => updateConfig('inactiveStrokeWidth', v)}
                        min={0.5}
                        max={5}
                        step={0.25}
                    />
                </PanelBody>

                {/* Hover Settings */}
                <PanelBody title={__('Hover Settings', 'icon-grid-unlimited')} initialOpen={false}>
                    <RangeControl
                        label={__('Hover Scale', 'icon-grid-unlimited')}
                        value={config.hoverScale || 1.08}
                        onChange={(v) => updateConfig('hoverScale', v)}
                        min={1}
                        max={1.5}
                        step={0.01}
                    />
                    <PopupColorPicker
                        label={__('Hover Background Color', 'icon-grid-unlimited')}
                        color={config.hoverBgColor || '#ffffff'}
                        onChange={(color) => updateConfig('hoverBgColor', color)}
                    />
                    <RangeControl
                        label={__('Hover Slide Amount (%)', 'icon-grid-unlimited')}
                        value={config.hoverSlideAmount || -10}
                        onChange={(v) => updateConfig('hoverSlideAmount', v)}
                        min={-50}
                        max={50}
                        step={1}
                    />
                </PanelBody>

                {/* Layout Settings */}
                <PanelBody title={__('Layout Settings', 'icon-grid-unlimited')} initialOpen={false}>
                    <ToggleControl
                        label={__('Enable Sticky Positioning', 'icon-grid-unlimited')}
                        checked={stickyEnabled}
                        onChange={(v) => setAttributes({ stickyEnabled: v })}
                        help={__('Makes the grid stick to viewport while scrolling (for column layouts)', 'icon-grid-unlimited')}
                    />
                    {stickyEnabled && (
                        <RangeControl
                            label={__('Sticky Offset from Top (px)', 'icon-grid-unlimited')}
                            value={stickyOffset || 20}
                            onChange={(v) => setAttributes({ stickyOffset: v })}
                            min={0}
                            max={200}
                            step={5}
                        />
                    )}
                    <ToggleControl
                        label={__('Center Vertically in Viewport', 'icon-grid-unlimited')}
                        checked={attributes.centerVertically}
                        onChange={(v) => setAttributes({ centerVertically: v })}
                        help={__('Dynamically calculates top offset to center grid in viewport', 'icon-grid-unlimited')}
                    />
                    {attributes.centerVertically && (
                        <TextControl
                            label={__('Target Selector (optional)', 'icon-grid-unlimited')}
                            value={attributes.centerTargetSelector || ''}
                            onChange={(v) => setAttributes({ centerTargetSelector: v })}
                            placeholder="#my-parent or .sticky-column"
                            help={__('ID or class of element to apply centering to. Leave empty for grid itself.', 'icon-grid-unlimited')}
                        />
                    )}
                </PanelBody>

                {/* Animation Rounds */}
                <PanelBody title={__('Animation Rounds', 'icon-grid-unlimited')} initialOpen={false}>
                    <p className="components-base-control__help">
                        {__('Define connection patterns for the animation loop.', 'icon-grid-unlimited')}
                    </p>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setRoundsText(JSON.stringify(animationRounds, null, 2));
                            setRoundsModalOpen(true);
                        }}
                    >
                        {__('Edit Animation Rounds', 'icon-grid-unlimited')}
                    </Button>
                    <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                        {animationRounds.length} {__('rounds defined', 'icon-grid-unlimited')}
                    </p>
                </PanelBody>

                {/* Grid Editor */}
                <PanelBody title={__('Grid & Icons', 'icon-grid-unlimited')} initialOpen={false}>
                    <p className="components-base-control__help">
                        {__('Configure labels, SVGs, and SEO data for each tile.', 'icon-grid-unlimited')}
                    </p>
                    <Button
                        variant="secondary"
                        onClick={() => setGridModalOpen(true)}
                    >
                        {__('Open Grid Editor', 'icon-grid-unlimited')}
                    </Button>
                    <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                        {iconLabels.filter(l => l !== '').length} {__('tiles configured', 'icon-grid-unlimited')}
                    </p>
                </PanelBody>
            </InspectorControls>

            {/* Animation Rounds Modal */}
            {isRoundsModalOpen && (
                <Modal
                    title={__('Animation Rounds Editor', 'icon-grid-unlimited')}
                    onRequestClose={() => setRoundsModalOpen(false)}
                    className="icon-grid-rounds-modal"
                    style={{ maxWidth: '900px', width: '100%' }}
                >
                    <Flex>
                        {/* Helper Grid */}
                        <FlexItem style={{ flex: '0 0 auto', maxWidth: '320px' }}>
                            <p><strong>{__('Tile Numbers Reference:', 'icon-grid-unlimited')}</strong> ({gridRows}×{gridCols})</p>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                                gap: '2px',
                                marginBottom: '15px'
                            }}>
                                {Array.from({ length: gridRows * gridCols }, (_, displayIndex) => {
                                    // Convert display index to storage index (12-column layout)
                                    const displayRow = Math.floor(displayIndex / gridCols);
                                    const displayCol = displayIndex % gridCols;
                                    const storageIndex = displayRow * 12 + displayCol;
                                    const hasContent = iconLabels[storageIndex] || iconSvgs[storageIndex];
                                    const tileNumber = displayIndex + 1; // 1-based position for animation rounds

                                    // Calculate tile size based on grid dimensions
                                    const tileSize = Math.max(24, Math.min(40, 280 / Math.max(gridRows, gridCols)));

                                    return (
                                        <div
                                            key={displayIndex}
                                            style={{
                                                width: `${tileSize}px`,
                                                height: `${tileSize}px`,
                                                border: hasContent ? '2px solid #007cba' : '1px solid #ddd',
                                                borderRadius: '3px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: tileSize < 30 ? '9px' : '11px',
                                                fontWeight: hasContent ? 'bold' : 'normal',
                                                background: hasContent ? '#e7f3ff' : '#fafafa',
                                                color: hasContent ? '#007cba' : '#666'
                                            }}
                                            title={iconLabels[storageIndex] || `Position ${tileNumber}`}
                                        >
                                            {tileNumber}
                                        </div>
                                    );
                                })}
                            </div>
                            <p style={{ fontSize: '11px', color: '#666' }}>
                                {__('Blue border = tile has label/SVG defined', 'icon-grid-unlimited')}
                            </p>
                        </FlexItem>

                        {/* Editor */}
                        <FlexItem style={{ flex: 1, paddingLeft: '20px', borderLeft: '1px solid #ddd' }}>
                            <div style={{ marginBottom: '15px' }}>
                                <p>{__('Format: Each round is an array of groups. Each group is [source, target1, target2?, "d"?]', 'icon-grid-unlimited')}</p>
                                <p>{__(`Positions: 1-${totalTilesInGrid} (1-based). Add "d" for diagonal lines (ortho is default).`, 'icon-grid-unlimited')}</p>
                                <pre style={{ background: '#f0f0f0', padding: '10px', fontSize: '11px' }}>
                                    {`Example:
[
  [[16, 15], [16, 23, 34]],
  [[10, 24, 5, "d"], [12, 10, 6]],
  [[7, 14], [15, 14]]
]`}
                                </pre>
                            </div>
                            <TextareaControl
                                value={roundsText}
                                onChange={setRoundsText}
                                rows={12}
                                style={{ fontFamily: 'monospace', fontSize: '12px' }}
                            />
                        </FlexItem>
                    </Flex>
                    <Flex justify="flex-end" style={{ marginTop: '15px' }}>
                        <FlexItem>
                            <Button variant="secondary" onClick={() => setRoundsModalOpen(false)}>
                                {__('Cancel', 'icon-grid-unlimited')}
                            </Button>
                        </FlexItem>
                        <FlexItem>
                            <Button variant="primary" onClick={saveRounds}>
                                {__('Save Rounds', 'icon-grid-unlimited')}
                            </Button>
                        </FlexItem>
                    </Flex>
                </Modal>
            )}

            {/* Grid Editor Modal */}
            {isGridModalOpen && (
                <Modal
                    title={__('Grid Editor', 'icon-grid-unlimited') + ` (${gridRows}×${gridCols})`}
                    onRequestClose={() => {
                        setGridModalOpen(false);
                        setSelectedTile(null);
                    }}
                    className="icon-grid-editor-modal"
                    style={{ maxWidth: '1000px', width: '100%' }}
                >
                    <Flex>
                        {/* Grid Preview - always 12x12 */}
                        <FlexItem style={{ flex: '0 0 auto' }}>
                            <p><strong>{__('Click a tile to edit:', 'icon-grid-unlimited')}</strong></p>
                            <div className="icon-grid-preview" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(12, 1fr)',
                                gap: '2px',
                                marginBottom: '20px'
                            }}>
                                {Array.from({ length: 144 }, (_, storageIndex) => {
                                    const row = Math.floor(storageIndex / 12);
                                    const col = storageIndex % 12;
                                    const isInBounds = row < gridRows && col < gridCols;
                                    const label = iconLabels[storageIndex];
                                    const hasContent = label || iconSvgs[storageIndex];

                                    // Calculate display number (1-based, within current grid bounds)
                                    const displayNumber = isInBounds ? (row * gridCols + col + 1) : '';

                                    return (
                                        <div
                                            key={storageIndex}
                                            draggable={hasContent}
                                            onDragStart={(e) => {
                                                if (hasContent) {
                                                    setDragFromTile(storageIndex);
                                                    e.dataTransfer.effectAllowed = 'move';
                                                }
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.dataTransfer.dropEffect = 'move';
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                if (dragFromTile !== null && dragFromTile !== storageIndex) {
                                                    moveTileSettings(dragFromTile, storageIndex);
                                                }
                                                setDragFromTile(null);
                                            }}
                                            onDragEnd={() => setDragFromTile(null)}
                                            onClick={() => setSelectedTile(storageIndex)}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                border: selectedTile === storageIndex
                                                    ? '2px solid #007cba'
                                                    : dragFromTile === storageIndex
                                                        ? '2px dashed #ff9800'
                                                        : isInBounds
                                                            ? '1px solid #ddd'
                                                            : '1px solid #eee',
                                                borderRadius: '3px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '8px',
                                                textAlign: 'center',
                                                cursor: hasContent ? 'grab' : 'pointer',
                                                background: dragFromTile !== null && dragFromTile !== storageIndex
                                                    ? '#fffde7'  // Highlight potential drop targets
                                                    : !isInBounds
                                                        ? (hasContent ? '#fff3e0' : '#f5f5f5')
                                                        : (hasContent ? '#e7f3ff' : '#fafafa'),
                                                opacity: dragFromTile === storageIndex ? 0.5 : (isInBounds ? 1 : 0.5),
                                                padding: '1px',
                                                overflow: 'hidden',
                                                color: hasContent ? '#007cba' : '#999',
                                                outline: dragFromTile !== null && dragFromTile !== storageIndex && isInBounds ? '2px dashed #4caf50' : 'none',
                                                outlineOffset: '-2px'
                                            }}
                                            title={`${hasContent ? 'Drag to move • ' : ''}Storage ${storageIndex + 1} (Row ${row + 1}, Col ${col + 1})${isInBounds ? '' : ' - outside grid'}${label ? ': ' + label : ''}`}
                                        >
                                            {displayNumber || '·'}
                                        </div>
                                    );
                                })}
                            </div>
                            <p style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                                {__('Drag tiles to move settings • Greyed tiles are outside current grid', 'icon-grid-unlimited')}
                            </p>
                        </FlexItem>

                        {/* Tile Editor */}
                        <FlexItem style={{ flex: 1, paddingLeft: '20px', borderLeft: '1px solid #ddd' }}>
                            {selectedTile !== null ? (() => {
                                const row = Math.floor(selectedTile / 12);
                                const col = selectedTile % 12;
                                const isInBounds = row < gridRows && col < gridCols;
                                const displayNumber = isInBounds ? (row * gridCols + col + 1) : null;

                                return (
                                    <div>
                                        <h3>
                                            {__('Tile', 'icon-grid-unlimited')} {displayNumber || `(${row + 1}-${col + 1})`}
                                            <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666', marginLeft: '8px' }}>
                                                Row {row + 1}, Col {col + 1}
                                            </span>
                                        </h3>

                                        {!isInBounds && (
                                            <div style={{
                                                background: '#fff3e0',
                                                border: '1px solid #ffcc80',
                                                borderRadius: '4px',
                                                padding: '8px 12px',
                                                marginBottom: '15px',
                                                fontSize: '12px'
                                            }}>
                                                ⚠️ {__('This tile is outside the current grid bounds. Data is preserved and will be visible if you increase grid size.', 'icon-grid-unlimited')}
                                            </div>
                                        )}

                                        <TextControl
                                            label={__('Label', 'icon-grid-unlimited')}
                                            value={iconLabels[selectedTile]}
                                            onChange={(v) => updateLabel(selectedTile, v)}
                                            placeholder={__('e.g., Webdesign', 'icon-grid-unlimited')}
                                        />

                                        <TextareaControl
                                            label={__('SVG Path', 'icon-grid-unlimited')}
                                            value={iconSvgs[selectedTile]}
                                            onChange={(v) => updateSvg(selectedTile, v)}
                                            placeholder={__('Paste SVG path here (e.g., <polygon points="..."/>)', 'icon-grid-unlimited')}
                                            rows={4}
                                            style={{ fontFamily: 'monospace', fontSize: '11px' }}
                                            disabled={getTileBlockSettings(selectedTile).enabled}
                                        />

                                        {/* Enable Block Section */}
                                        <div style={{ marginTop: '20px', padding: '12px', background: '#e8f4f8', borderRadius: '4px', border: '1px solid #b8dadd' }}>
                                            <ToggleControl
                                                label={__('Enable Block (replaces SVG)', 'icon-grid-unlimited')}
                                                checked={getTileBlockSettings(selectedTile).enabled}
                                                onChange={(v) => updateTileBlockSettings(selectedTile, 'enabled', v)}
                                                help={__('When enabled, a Gutenberg block is used instead of the SVG icon.', 'icon-grid-unlimited')}
                                            />
                                            {getTileBlockSettings(selectedTile).enabled && (
                                                <>
                                                    <TextareaControl
                                                        label={__('Block HTML', 'icon-grid-unlimited')}
                                                        value={tileBlocks[selectedTile] || ''}
                                                        onChange={(v) => updateTileBlock(selectedTile, v)}
                                                        placeholder={__('Paste block HTML here (e.g., <div class="...">content</div>)', 'icon-grid-unlimited')}
                                                        rows={6}
                                                        style={{ fontFamily: 'monospace', fontSize: '11px' }}
                                                    />
                                                    <p style={{ fontSize: '11px', color: '#666', marginTop: '-8px', marginBottom: '12px' }}>
                                                        {__('Tip: Use the block editor to create content, then copy the HTML and paste here.', 'icon-grid-unlimited')}
                                                    </p>
                                                    <h4 style={{ marginBottom: '8px' }}>{__('Hover Animation Options', 'icon-grid-unlimited')}</h4>
                                                    <ToggleControl
                                                        label={__('Opacity fade (0.3 → 1.0)', 'icon-grid-unlimited')}
                                                        checked={getTileBlockSettings(selectedTile).hoverOpacity}
                                                        onChange={(v) => updateTileBlockSettings(selectedTile, 'hoverOpacity', v)}
                                                    />
                                                    <ToggleControl
                                                        label={__('Scale + shadow (like SVG tiles)', 'icon-grid-unlimited')}
                                                        checked={getTileBlockSettings(selectedTile).hoverScale}
                                                        onChange={(v) => updateTileBlockSettings(selectedTile, 'hoverScale', v)}
                                                    />
                                                    <h4 style={{ marginTop: '12px', marginBottom: '8px' }}>{__('Display Options', 'icon-grid-unlimited')}</h4>
                                                    <ToggleControl
                                                        label={__('Show label', 'icon-grid-unlimited')}
                                                        checked={getTileBlockSettings(selectedTile).showLabel}
                                                        onChange={(v) => updateTileBlockSettings(selectedTile, 'showLabel', v)}
                                                    />
                                                </>
                                            )}
                                        </div>

                                        {/* Per-tile Icon Settings */}
                                        <div style={{ marginTop: '20px', padding: '12px', background: '#f9f9f9', borderRadius: '4px' }}>
                                            <ToggleControl
                                                label={__('Custom Icon Settings for this tile', 'icon-grid-unlimited')}
                                                checked={perTileIconSettings[selectedTile]?.enabled || false}
                                                onChange={(v) => updatePerTileSettings(selectedTile, 'enabled', v)}
                                            />
                                            {perTileIconSettings[selectedTile]?.enabled && (
                                                <>
                                                    <RangeControl
                                                        label={__('Icon X Offset (%)', 'icon-grid-unlimited')}
                                                        value={perTileIconSettings[selectedTile]?.offsetX || 0}
                                                        onChange={(v) => updatePerTileSettings(selectedTile, 'offsetX', v)}
                                                        min={-50}
                                                        max={50}
                                                        step={1}
                                                    />
                                                    <RangeControl
                                                        label={__('Icon Y Offset (%)', 'icon-grid-unlimited')}
                                                        value={perTileIconSettings[selectedTile]?.offsetY || 0}
                                                        onChange={(v) => updatePerTileSettings(selectedTile, 'offsetY', v)}
                                                        min={-50}
                                                        max={50}
                                                        step={1}
                                                    />
                                                    <RangeControl
                                                        label={__('Icon Scale', 'icon-grid-unlimited')}
                                                        value={perTileIconSettings[selectedTile]?.scale || 1}
                                                        onChange={(v) => updatePerTileSettings(selectedTile, 'scale', v)}
                                                        min={0.5}
                                                        max={2}
                                                        step={0.05}
                                                    />
                                                    <hr style={{ margin: '15px 0', borderColor: '#ddd' }} />
                                                    <p style={{ fontWeight: '500', fontSize: '12px', marginBottom: '10px' }}>
                                                        {__('Cell Size Override', 'icon-grid-unlimited')}
                                                    </p>
                                                    <RangeControl
                                                        label={__('Cell Width (%)', 'icon-grid-unlimited')}
                                                        value={perTileIconSettings[selectedTile]?.cellWidth || 100}
                                                        onChange={(v) => updatePerTileSettings(selectedTile, 'cellWidth', v)}
                                                        min={20}
                                                        max={400}
                                                        step={5}
                                                    />
                                                    <RangeControl
                                                        label={__('Cell Height (%)', 'icon-grid-unlimited')}
                                                        value={perTileIconSettings[selectedTile]?.cellHeight || 100}
                                                        onChange={(v) => updatePerTileSettings(selectedTile, 'cellHeight', v)}
                                                        min={20}
                                                        max={400}
                                                        step={5}
                                                    />
                                                    <ToggleControl
                                                        label={__('Center Enlarged Cell', 'icon-grid-unlimited')}
                                                        checked={perTileIconSettings[selectedTile]?.centerCell || false}
                                                        onChange={(v) => updatePerTileSettings(selectedTile, 'centerCell', v)}
                                                        help={__('Translates cell to stay centered when enlarged', 'icon-grid-unlimited')}
                                                    />
                                                    <RangeControl
                                                        label={__('Cell Offset X (%)', 'icon-grid-unlimited')}
                                                        value={perTileIconSettings[selectedTile]?.cellOffsetX || 0}
                                                        onChange={(v) => updatePerTileSettings(selectedTile, 'cellOffsetX', v)}
                                                        min={-100}
                                                        max={100}
                                                        step={1}
                                                        help={__('Additional horizontal offset after centering', 'icon-grid-unlimited')}
                                                    />
                                                    <RangeControl
                                                        label={__('Cell Offset Y (%)', 'icon-grid-unlimited')}
                                                        value={perTileIconSettings[selectedTile]?.cellOffsetY || 0}
                                                        onChange={(v) => updatePerTileSettings(selectedTile, 'cellOffsetY', v)}
                                                        min={-100}
                                                        max={100}
                                                        step={1}
                                                        help={__('Additional vertical offset after centering', 'icon-grid-unlimited')}
                                                    />
                                                    <ToggleControl
                                                        label={__('Scale Label with Cell', 'icon-grid-unlimited')}
                                                        checked={perTileIconSettings[selectedTile]?.scaleLabel || false}
                                                        onChange={(v) => updatePerTileSettings(selectedTile, 'scaleLabel', v)}
                                                        help={__('Label text scales proportionally with cell size', 'icon-grid-unlimited')}
                                                    />
                                                </>
                                            )}
                                        </div>

                                        {iconLabels[selectedTile] && (
                                            <>
                                                <h4 style={{ marginTop: '20px' }}>{__('SEO Data', 'icon-grid-unlimited')}</h4>
                                                <TextControl
                                                    label={__('URL', 'icon-grid-unlimited')}
                                                    value={seoData[iconLabels[selectedTile]]?.url || ''}
                                                    onChange={(v) => updateSeoData(iconLabels[selectedTile], 'url', v)}
                                                    placeholder="/leistungen/webdesign/"
                                                />
                                                <TextControl
                                                    label={__('Description', 'icon-grid-unlimited')}
                                                    value={seoData[iconLabels[selectedTile]]?.description || ''}
                                                    onChange={(v) => updateSeoData(iconLabels[selectedTile], 'description', v)}
                                                    placeholder={__('SEO description for this service', 'icon-grid-unlimited')}
                                                />
                                                <TextControl
                                                    label={__('Service Type', 'icon-grid-unlimited')}
                                                    value={seoData[iconLabels[selectedTile]]?.serviceType || ''}
                                                    onChange={(v) => updateSeoData(iconLabels[selectedTile], 'serviceType', v)}
                                                    placeholder="Web Design"
                                                />
                                            </>
                                        )}
                                    </div>
                                );
                            })() : (
                                <p style={{ color: '#666' }}>{__('← Click a tile to edit its settings', 'icon-grid-unlimited')}</p>
                            )}
                        </FlexItem>
                    </Flex>

                    <Flex justify="flex-end" style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                        <Button variant="primary" onClick={() => {
                            setGridModalOpen(false);
                            setSelectedTile(null);
                        }}>
                            {__('Done', 'icon-grid-unlimited')}
                        </Button>
                    </Flex>
                </Modal>
            )}

            {/* Block Preview in Editor */}
            <div {...blockProps}>
                <div className="icon-grid-editor-preview">
                    <div className="icon-grid-preview-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                        gap: gridCols > 8 ? '5px' : '10px',
                        padding: '20px',
                        background: '#fafafa',
                        borderRadius: '8px'
                    }}>
                        {Array.from({ length: gridRows * gridCols }, (_, displayIndex) => {
                            // Convert display index to storage index (12-column layout)
                            const displayRow = Math.floor(displayIndex / gridCols);
                            const displayCol = displayIndex % gridCols;
                            const storageIndex = displayRow * 12 + displayCol;
                            const label = iconLabels[storageIndex];

                            return (
                                <div
                                    key={displayIndex}
                                    style={{
                                        aspectRatio: '1',
                                        border: '1px solid #ddd',
                                        borderRadius: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: gridCols > 8 ? '9px' : '11px',
                                        textAlign: 'center',
                                        background: label ? '#fff' : 'transparent',
                                        padding: '3px'
                                    }}
                                >
                                    {label || ''}
                                </div>
                            );
                        })}
                    </div>
                    <p style={{ textAlign: 'center', marginTop: '10px', color: '#666', fontSize: '12px' }}>
                        {gridRows}×{gridCols} {__('Icon Grid Preview - Animation plays on frontend', 'icon-grid-unlimited')}
                    </p>
                </div>
            </div>
        </>
    );
}
