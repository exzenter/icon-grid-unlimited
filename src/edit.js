/**
 * Icon Grid Block - Editor Component
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls, InnerBlocks } from '@wordpress/block-editor';
import { serialize, parse } from '@wordpress/blocks';
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
    const [dragFromTile, setDragFromTile] = useState(null);
    const [blockEditorTile, setBlockEditorTile] = useState(null); // Tile index for block editor modal

    // Visual Animation Rounds Editor state
    const [selectedRoundIndex, setSelectedRoundIndex] = useState(null);
    const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);
    const [connectionMode, setConnectionMode] = useState(false);
    const [pendingConnection, setPendingConnection] = useState({ source: null, targets: [] });

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

    // Visual Rounds Editor helper functions
    const addRound = () => {
        const newRounds = [...animationRounds, []];
        setAttributes({ animationRounds: newRounds });
        setSelectedRoundIndex(newRounds.length - 1);
        setSelectedGroupIndex(null);
    };

    const removeRound = (index) => {
        const newRounds = animationRounds.filter((_, i) => i !== index);
        setAttributes({ animationRounds: newRounds });
        if (selectedRoundIndex === index) {
            setSelectedRoundIndex(null);
            setSelectedGroupIndex(null);
        } else if (selectedRoundIndex > index) {
            setSelectedRoundIndex(selectedRoundIndex - 1);
        }
    };

    const addGroup = (roundIndex) => {
        const newRounds = [...animationRounds];
        newRounds[roundIndex] = [...(newRounds[roundIndex] || []), []];
        setAttributes({ animationRounds: newRounds });
        setSelectedGroupIndex(newRounds[roundIndex].length - 1);
        setConnectionMode(true);
        setPendingConnection({ source: null, targets: [] });
    };

    const removeGroup = (roundIndex, groupIndex) => {
        const newRounds = [...animationRounds];
        newRounds[roundIndex] = newRounds[roundIndex].filter((_, i) => i !== groupIndex);
        setAttributes({ animationRounds: newRounds });
        if (selectedGroupIndex === groupIndex) {
            setSelectedGroupIndex(null);
            setConnectionMode(false);
            setPendingConnection({ source: null, targets: [] });
        } else if (selectedGroupIndex > groupIndex) {
            setSelectedGroupIndex(selectedGroupIndex - 1);
        }
    };

    const updateGroup = (roundIndex, groupIndex, newGroup) => {
        const newRounds = [...animationRounds];
        newRounds[roundIndex] = [...newRounds[roundIndex]];
        newRounds[roundIndex][groupIndex] = newGroup;
        setAttributes({ animationRounds: newRounds });
    };

    const toggleDiagonal = (roundIndex, groupIndex) => {
        const group = animationRounds[roundIndex]?.[groupIndex];
        if (!group || group.length < 2) return;

        const hasDiagonal = group[group.length - 1] === 'd';
        let newGroup;
        if (hasDiagonal) {
            newGroup = group.slice(0, -1);
        } else {
            newGroup = [...group, 'd'];
        }
        updateGroup(roundIndex, groupIndex, newGroup);
    };

    const handleRoundsTileClick = (tileNumber) => {
        if (!connectionMode || selectedRoundIndex === null || selectedGroupIndex === null) return;

        const currentGroup = animationRounds[selectedRoundIndex]?.[selectedGroupIndex] || [];
        const hasDiagonal = currentGroup[currentGroup.length - 1] === 'd';
        const numericEntries = currentGroup.filter(e => typeof e === 'number');

        if (pendingConnection.source === null && numericEntries.length === 0) {
            // First click sets source
            const newGroup = hasDiagonal ? [tileNumber, 'd'] : [tileNumber];
            updateGroup(selectedRoundIndex, selectedGroupIndex, newGroup);
            setPendingConnection({ source: tileNumber, targets: [] });
        } else {
            // Subsequent clicks add targets
            const source = numericEntries[0] || pendingConnection.source;
            const existingTargets = numericEntries.slice(1);

            // Toggle target: remove if already exists, add if not
            const targetIndex = existingTargets.indexOf(tileNumber);
            let newTargets;
            if (targetIndex >= 0) {
                newTargets = existingTargets.filter(t => t !== tileNumber);
            } else if (tileNumber !== source) {
                newTargets = [...existingTargets, tileNumber];
            } else {
                return; // Can't add source as target
            }

            const newGroup = hasDiagonal ? [source, ...newTargets, 'd'] : [source, ...newTargets];
            updateGroup(selectedRoundIndex, selectedGroupIndex, newGroup);
            setPendingConnection({ source, targets: newTargets });
        }
    };

    const finishConnection = () => {
        setConnectionMode(false);
        setPendingConnection({ source: null, targets: [] });
    };

    const editGroup = (roundIndex, groupIndex) => {
        setSelectedRoundIndex(roundIndex);
        setSelectedGroupIndex(groupIndex);
        const group = animationRounds[roundIndex]?.[groupIndex] || [];
        const numericEntries = group.filter(e => typeof e === 'number');
        setPendingConnection({
            source: numericEntries[0] || null,
            targets: numericEntries.slice(1)
        });
        setConnectionMode(true);
    };

    const getGroupInfo = (group) => {
        if (!group || group.length === 0) return { source: null, targets: [], isDiagonal: false };
        const hasDiagonal = group[group.length - 1] === 'd';
        const numericEntries = group.filter(e => typeof e === 'number');
        return {
            source: numericEntries[0] || null,
            targets: numericEntries.slice(1),
            isDiagonal: hasDiagonal
        };
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
                {/* Quick Access Buttons - Always Visible */}
                <div style={{ padding: '16px', borderBottom: '1px solid #ddd', display: 'flex', gap: '8px' }}>
                    <Button
                        variant="primary"
                        onClick={() => setGridModalOpen(true)}
                        style={{ flex: 1 }}
                    >
                        {__('Grid Editor', 'icon-grid-unlimited')}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => setRoundsModalOpen(true)}
                        style={{ flex: 1 }}
                    >
                        {__('Animation Rounds', 'icon-grid-unlimited')}
                    </Button>
                </div>

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

                    <p style={{ fontWeight: '500', fontSize: '12px', color: '#1e1e1e', marginBottom: '10px' }}>
                        {__('Grid Gap (uses clamp)', 'icon-grid-unlimited')}
                    </p>
                    <Flex gap={4}>
                        <FlexItem style={{ flex: 1 }}>
                            <RangeControl
                                label={__('Min (px)', 'icon-grid-unlimited')}
                                value={config.gridGapMin || 6}
                                onChange={(v) => updateConfig('gridGapMin', v)}
                                min={0}
                                max={50}
                                step={1}
                            />
                        </FlexItem>
                        <FlexItem style={{ flex: 1 }}>
                            <RangeControl
                                label={__('Max (px)', 'icon-grid-unlimited')}
                                value={config.gridGapMax || 15}
                                onChange={(v) => updateConfig('gridGapMax', v)}
                                min={0}
                                max={100}
                                step={1}
                            />
                        </FlexItem>
                    </Flex>

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
                    <RangeControl
                        label={__('Tile Border Radius (px)', 'icon-grid-unlimited')}
                        value={config.tileBorderRadius ?? 5}
                        onChange={(v) => updateConfig('tileBorderRadius', v)}
                        min={0}
                        max={50}
                        step={1}
                    />
                    <PopupColorPicker
                        label={__('Inactive Background Color', 'icon-grid-unlimited')}
                        color={config.inactiveBgColor || 'rgba(255,255,255,0)'}
                        onChange={(color) => updateConfig('inactiveBgColor', color)}
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
                    <ToggleControl
                        label={__('Enable Glassmorphism', 'icon-grid-unlimited')}
                        checked={config.inactiveGlass}
                        onChange={(v) => updateConfig('inactiveGlass', v)}
                    />
                    {config.inactiveGlass && (
                        <RangeControl
                            label={__('Glass Blur (px)', 'icon-grid-unlimited')}
                            value={config.inactiveGlassBlur || 10}
                            onChange={(v) => updateConfig('inactiveGlassBlur', v)}
                            min={0}
                            max={50}
                            step={1}
                        />
                    )}
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
                    <ToggleControl
                        label={__('Enable Glassmorphism', 'icon-grid-unlimited')}
                        checked={config.hoverGlass}
                        onChange={(v) => updateConfig('hoverGlass', v)}
                    />
                    {config.hoverGlass && (
                        <RangeControl
                            label={__('Glass Blur (px)', 'icon-grid-unlimited')}
                            value={config.hoverGlassBlur || 10}
                            onChange={(v) => updateConfig('hoverGlassBlur', v)}
                            min={0}
                            max={50}
                            step={1}
                        />
                    )}
                    <RangeControl
                        label={__('Hover Slide Amount (%)', 'icon-grid-unlimited')}
                        value={config.hoverSlideAmount || -10}
                        onChange={(v) => updateConfig('hoverSlideAmount', v)}
                        min={-50}
                        max={50}
                        step={1}
                    />

                    <hr style={{ margin: '20px 0', borderColor: '#ddd' }} />

                    <p style={{ fontWeight: '500', fontSize: '12px', color: '#1e1e1e', marginBottom: '10px' }}>
                        {__('Active Tile Shadow', 'icon-grid-unlimited')}
                    </p>
                    <Flex gap={4}>
                        <FlexItem style={{ flex: 1 }}>
                            <RangeControl
                                label={__('X Offset', 'icon-grid-unlimited')}
                                value={config.activeShadowX ?? 0}
                                onChange={(v) => updateConfig('activeShadowX', v)}
                                min={-20}
                                max={20}
                                step={1}
                            />
                        </FlexItem>
                        <FlexItem style={{ flex: 1 }}>
                            <RangeControl
                                label={__('Y Offset', 'icon-grid-unlimited')}
                                value={config.activeShadowY ?? 8}
                                onChange={(v) => updateConfig('activeShadowY', v)}
                                min={-20}
                                max={20}
                                step={1}
                            />
                        </FlexItem>
                    </Flex>
                    <Flex gap={4}>
                        <FlexItem style={{ flex: 1 }}>
                            <RangeControl
                                label={__('Blur', 'icon-grid-unlimited')}
                                value={config.activeShadowBlur ?? 10}
                                onChange={(v) => updateConfig('activeShadowBlur', v)}
                                min={0}
                                max={50}
                                step={1}
                            />
                        </FlexItem>
                        <FlexItem style={{ flex: 1 }}>
                            <RangeControl
                                label={__('Spread', 'icon-grid-unlimited')}
                                value={config.activeShadowSpread ?? 0}
                                onChange={(v) => updateConfig('activeShadowSpread', v)}
                                min={-20}
                                max={20}
                                step={1}
                            />
                        </FlexItem>
                    </Flex>
                    <PopupColorPicker
                        label={__('Shadow Color', 'icon-grid-unlimited')}
                        color={config.activeShadowColor || 'rgba(0,0,0,0.10)'}
                        onChange={(color) => updateConfig('activeShadowColor', color)}
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
                        onClick={() => setRoundsModalOpen(true)}
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

            {/* Animation Rounds Modal - Visual Editor */}
            {isRoundsModalOpen && (
                <Modal
                    title={__('Animation Rounds Editor', 'icon-grid-unlimited')}
                    onRequestClose={() => {
                        setRoundsModalOpen(false);
                        setSelectedRoundIndex(null);
                        setSelectedGroupIndex(null);
                        setConnectionMode(false);
                        setPendingConnection({ source: null, targets: [] });
                    }}
                    className="icon-grid-rounds-modal"
                    style={{ maxWidth: '1200px', width: '100%' }}
                >
                    <Flex style={{ gap: '20px', minHeight: '500px' }}>
                        {/* Rounds List Panel */}
                        <FlexItem style={{ flex: '0 0 180px', borderRight: '1px solid #ddd', paddingRight: '15px' }}>
                            <p style={{ fontWeight: '600', marginBottom: '10px' }}>{__('Rounds', 'icon-grid-unlimited')}</p>
                            <div style={{ marginBottom: '10px' }}>
                                {animationRounds.map((round, roundIndex) => (
                                    <div
                                        key={roundIndex}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 10px',
                                            marginBottom: '4px',
                                            background: selectedRoundIndex === roundIndex ? '#007cba' : '#f0f0f0',
                                            color: selectedRoundIndex === roundIndex ? '#fff' : '#333',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '13px'
                                        }}
                                        onClick={() => {
                                            setSelectedRoundIndex(roundIndex);
                                            setSelectedGroupIndex(null);
                                            setConnectionMode(false);
                                            setPendingConnection({ source: null, targets: [] });
                                        }}
                                    >
                                        <span style={{ flex: 1 }}>
                                            {__('Round', 'icon-grid-unlimited')} {roundIndex + 1}
                                            <span style={{
                                                fontSize: '11px',
                                                opacity: selectedRoundIndex === roundIndex ? 0.8 : 0.6,
                                                marginLeft: '4px'
                                            }}>
                                                ({round.length} {round.length === 1 ? 'group' : 'groups'})
                                            </span>
                                        </span>
                                        <Button
                                            isSmall
                                            isDestructive
                                            variant="tertiary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeRound(roundIndex);
                                            }}
                                            style={{
                                                minWidth: '24px',
                                                padding: '2px',
                                                color: selectedRoundIndex === roundIndex ? '#fff' : undefined
                                            }}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button
                                variant="secondary"
                                isSmall
                                onClick={addRound}
                                style={{ width: '100%' }}
                            >
                                + {__('Add Round', 'icon-grid-unlimited')}
                            </Button>
                        </FlexItem>

                        {/* Visual Grid Panel */}
                        <FlexItem style={{ flex: '1 1 auto', position: 'relative' }}>
                            <div style={{ marginBottom: '10px' }}>
                                <p style={{ fontWeight: '600', marginBottom: '5px' }}>
                                    {connectionMode
                                        ? __('Click tiles to create connection:', 'icon-grid-unlimited')
                                        : __('Visual Grid', 'icon-grid-unlimited')
                                    }
                                    <span style={{ fontWeight: 'normal', fontSize: '12px', marginLeft: '8px', color: '#666' }}>
                                        ({gridRows}×{gridCols})
                                    </span>
                                </p>
                                {connectionMode && (
                                    <p style={{ fontSize: '12px', color: '#007cba', margin: '5px 0' }}>
                                        {pendingConnection.source === null
                                            ? __('Click a tile to set as SOURCE', 'icon-grid-unlimited')
                                            : __('Click tiles to add/remove TARGETS. Click source again to finish.', 'icon-grid-unlimited')
                                        }
                                    </p>
                                )}
                            </div>

                            {/* Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                                gap: '3px',
                                maxWidth: '500px'
                            }}>
                                {Array.from({ length: gridRows * gridCols }, (_, displayIndex) => {
                                    const tileNumber = displayIndex + 1;
                                    const displayRow = Math.floor(displayIndex / gridCols);
                                    const displayCol = displayIndex % gridCols;
                                    const storageIndex = displayRow * 12 + displayCol;
                                    const hasContent = iconLabels[storageIndex] || iconSvgs[storageIndex];

                                    // Check if this tile is part of selected group
                                    const currentGroup = selectedRoundIndex !== null && selectedGroupIndex !== null
                                        ? animationRounds[selectedRoundIndex]?.[selectedGroupIndex]
                                        : null;
                                    const groupInfo = currentGroup ? getGroupInfo(currentGroup) : { source: null, targets: [] };
                                    const isSource = groupInfo.source === tileNumber;
                                    const isTarget = groupInfo.targets.includes(tileNumber);

                                    // Check if part of any group in selected round
                                    let isInRound = false;
                                    if (selectedRoundIndex !== null && selectedGroupIndex === null) {
                                        animationRounds[selectedRoundIndex]?.forEach(g => {
                                            const gi = getGroupInfo(g);
                                            if (gi.source === tileNumber || gi.targets.includes(tileNumber)) {
                                                isInRound = true;
                                            }
                                        });
                                    }

                                    const tileSize = Math.max(28, Math.min(42, 400 / Math.max(gridRows, gridCols)));

                                    return (
                                        <div
                                            key={displayIndex}
                                            onClick={() => handleRoundsTileClick(tileNumber)}
                                            style={{
                                                width: `${tileSize}px`,
                                                height: `${tileSize}px`,
                                                border: isSource
                                                    ? '2px solid #007cba'
                                                    : isTarget
                                                        ? '2px solid #4caf50'
                                                        : isInRound
                                                            ? '2px solid #ff9800'
                                                            : hasContent
                                                                ? '1px solid #007cba'
                                                                : '1px solid #ddd',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: tileSize < 32 ? '10px' : '12px',
                                                fontWeight: (isSource || isTarget) ? 'bold' : 'normal',
                                                background: isSource
                                                    ? '#007cba'
                                                    : isTarget
                                                        ? '#4caf50'
                                                        : isInRound
                                                            ? '#fff3e0'
                                                            : hasContent
                                                                ? '#e7f3ff'
                                                                : '#fafafa',
                                                color: (isSource || isTarget) ? '#fff' : hasContent ? '#007cba' : '#666',
                                                cursor: connectionMode ? 'pointer' : 'default',
                                                transition: 'all 0.15s ease',
                                                position: 'relative',
                                                zIndex: 1
                                            }}
                                            title={`${iconLabels[storageIndex] || 'Tile'} ${tileNumber}${isSource ? ' (Source)' : ''}${isTarget ? ' (Target)' : ''}`}
                                        >
                                            {tileNumber}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div style={{ marginTop: '15px', fontSize: '11px', color: '#666', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                <span>🔵 Source</span>
                                <span>🟢 Target</span>
                                <span>🟠 In round</span>
                                <span style={{ opacity: 0.7 }}>Blue border = has content</span>
                            </div>
                        </FlexItem>

                        {/* Groups Panel */}
                        <FlexItem style={{ flex: '0 0 220px', borderLeft: '1px solid #ddd', paddingLeft: '15px' }}>
                            {selectedRoundIndex !== null ? (
                                <>
                                    <p style={{ fontWeight: '600', marginBottom: '10px' }}>
                                        {__('Groups in Round', 'icon-grid-unlimited')} {selectedRoundIndex + 1}
                                    </p>

                                    <div style={{ marginBottom: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                                        {(animationRounds[selectedRoundIndex] || []).map((group, groupIndex) => {
                                            const info = getGroupInfo(group);
                                            const isSelected = selectedGroupIndex === groupIndex;

                                            return (
                                                <div
                                                    key={groupIndex}
                                                    style={{
                                                        padding: '10px',
                                                        marginBottom: '6px',
                                                        background: isSelected ? '#e7f3ff' : '#f8f8f8',
                                                        border: isSelected ? '2px solid #007cba' : '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    <Flex align="center" style={{ marginBottom: '6px' }}>
                                                        <FlexItem style={{ flex: 1, fontWeight: '500' }}>
                                                            {__('Group', 'icon-grid-unlimited')} {groupIndex + 1}
                                                        </FlexItem>
                                                        <FlexItem>
                                                            <Button
                                                                isSmall
                                                                variant="tertiary"
                                                                onClick={() => editGroup(selectedRoundIndex, groupIndex)}
                                                                style={{ padding: '2px 6px', fontSize: '11px' }}
                                                            >
                                                                {__('Edit', 'icon-grid-unlimited')}
                                                            </Button>
                                                            <Button
                                                                isSmall
                                                                isDestructive
                                                                variant="tertiary"
                                                                onClick={() => removeGroup(selectedRoundIndex, groupIndex)}
                                                                style={{ padding: '2px 6px', fontSize: '11px' }}
                                                            >
                                                                ×
                                                            </Button>
                                                        </FlexItem>
                                                    </Flex>

                                                    <div style={{ fontSize: '11px', color: '#555' }}>
                                                        <div>
                                                            <strong>{__('Source:', 'icon-grid-unlimited')}</strong> {info.source || '—'}
                                                        </div>
                                                        <div>
                                                            <strong>{__('Targets:', 'icon-grid-unlimited')}</strong> {info.targets.length > 0 ? info.targets.join(', ') : '—'}
                                                        </div>
                                                    </div>

                                                    <ToggleControl
                                                        label={__('Diagonal', 'icon-grid-unlimited')}
                                                        checked={info.isDiagonal}
                                                        onChange={() => toggleDiagonal(selectedRoundIndex, groupIndex)}
                                                        __nextHasNoMarginBottom
                                                        style={{ marginTop: '6px', marginBottom: 0 }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <Flex gap={2}>
                                        <Button
                                            variant="secondary"
                                            isSmall
                                            onClick={() => addGroup(selectedRoundIndex)}
                                            style={{ flex: 1 }}
                                        >
                                            + {__('Add Group', 'icon-grid-unlimited')}
                                        </Button>
                                        {connectionMode && (
                                            <Button
                                                variant="primary"
                                                isSmall
                                                onClick={finishConnection}
                                            >
                                                {__('Done', 'icon-grid-unlimited')}
                                            </Button>
                                        )}
                                    </Flex>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#666', paddingTop: '50px' }}>
                                    <p>{__('← Select a round to edit its groups', 'icon-grid-unlimited')}</p>
                                </div>
                            )}
                        </FlexItem>
                    </Flex>

                    <Flex justify="flex-end" style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                        <Button
                            variant="primary"
                            onClick={() => {
                                setRoundsModalOpen(false);
                                setSelectedRoundIndex(null);
                                setSelectedGroupIndex(null);
                                setConnectionMode(false);
                            }}
                        >
                            {__('Done', 'icon-grid-unlimited')}
                        </Button>
                    </Flex>
                </Modal >
            )
            }

            {/* Grid Editor Modal */}
            {
                isGridModalOpen && (
                    <Modal
                        title={__('Grid Editor', 'icon-grid-unlimited') + ` (${gridRows}×${gridCols})`}
                        onRequestClose={() => {
                            setGridModalOpen(false);
                            setSelectedTile(null);
                        }}
                        className="icon-grid-editor-modal"
                        style={{ maxWidth: '1300px', width: '100%' }}
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
                                                draggable={hasContent ? "true" : "false"}
                                                onDragStart={(e) => {
                                                    if (!hasContent) {
                                                        e.preventDefault();
                                                        return;
                                                    }
                                                    setDragFromTile(storageIndex);
                                                    e.dataTransfer.effectAllowed = 'move';
                                                    e.dataTransfer.setData('text/plain', storageIndex.toString());
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
                                                    outlineOffset: '-2px',
                                                    userSelect: 'none'
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
                                                        <Flex gap={2} style={{ marginBottom: '12px' }}>
                                                            <FlexItem>
                                                                <Button
                                                                    variant="primary"
                                                                    onClick={() => setBlockEditorTile(selectedTile)}
                                                                >
                                                                    {tileBlocks[selectedTile] ? __('Edit Block', 'icon-grid-unlimited') : __('Add Block', 'icon-grid-unlimited')}
                                                                </Button>
                                                            </FlexItem>
                                                            {tileBlocks[selectedTile] && (
                                                                <FlexItem>
                                                                    <Button
                                                                        variant="secondary"
                                                                        isDestructive
                                                                        onClick={() => updateTileBlock(selectedTile, '')}
                                                                    >
                                                                        {__('Clear', 'icon-grid-unlimited')}
                                                                    </Button>
                                                                </FlexItem>
                                                            )}
                                                        </Flex>
                                                        {tileBlocks[selectedTile] && (
                                                            <div style={{
                                                                padding: '8px',
                                                                background: '#fff',
                                                                border: '1px solid #ddd',
                                                                borderRadius: '4px',
                                                                marginBottom: '12px',
                                                                fontSize: '11px',
                                                                fontFamily: 'monospace',
                                                                maxHeight: '80px',
                                                                overflow: 'auto'
                                                            }}>
                                                                {tileBlocks[selectedTile].substring(0, 200)}
                                                                {tileBlocks[selectedTile].length > 200 && '...'}
                                                            </div>
                                                        )}
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
                                                        {/* Icon Settings - 2 column grid */}
                                                        <Flex gap={3} style={{ marginBottom: '8px' }}>
                                                            <FlexItem style={{ flex: 1 }}>
                                                                <RangeControl
                                                                    label={__('X Offset (%)', 'icon-grid-unlimited')}
                                                                    value={perTileIconSettings[selectedTile]?.offsetX || 0}
                                                                    onChange={(v) => updatePerTileSettings(selectedTile, 'offsetX', v)}
                                                                    min={-50}
                                                                    max={50}
                                                                    step={1}
                                                                />
                                                            </FlexItem>
                                                            <FlexItem style={{ flex: 1 }}>
                                                                <RangeControl
                                                                    label={__('Y Offset (%)', 'icon-grid-unlimited')}
                                                                    value={perTileIconSettings[selectedTile]?.offsetY || 0}
                                                                    onChange={(v) => updatePerTileSettings(selectedTile, 'offsetY', v)}
                                                                    min={-50}
                                                                    max={50}
                                                                    step={1}
                                                                />
                                                            </FlexItem>
                                                        </Flex>
                                                        <RangeControl
                                                            label={__('Icon Scale', 'icon-grid-unlimited')}
                                                            value={perTileIconSettings[selectedTile]?.scale || 1}
                                                            onChange={(v) => updatePerTileSettings(selectedTile, 'scale', v)}
                                                            min={0.5}
                                                            max={2}
                                                            step={0.05}
                                                        />

                                                        <hr style={{ margin: '12px 0', borderColor: '#ddd' }} />
                                                        <p style={{ fontWeight: '500', fontSize: '12px', marginBottom: '8px' }}>
                                                            {__('Cell Size Override', 'icon-grid-unlimited')}
                                                        </p>

                                                        <Flex gap={3} style={{ marginBottom: '8px' }}>
                                                            <FlexItem style={{ flex: 1 }}>
                                                                <RangeControl
                                                                    label={__('Width (%)', 'icon-grid-unlimited')}
                                                                    value={perTileIconSettings[selectedTile]?.cellWidth || 100}
                                                                    onChange={(v) => updatePerTileSettings(selectedTile, 'cellWidth', v)}
                                                                    min={20}
                                                                    max={400}
                                                                    step={5}
                                                                />
                                                            </FlexItem>
                                                            <FlexItem style={{ flex: 1 }}>
                                                                <RangeControl
                                                                    label={__('Height (%)', 'icon-grid-unlimited')}
                                                                    value={perTileIconSettings[selectedTile]?.cellHeight || 100}
                                                                    onChange={(v) => updatePerTileSettings(selectedTile, 'cellHeight', v)}
                                                                    min={20}
                                                                    max={400}
                                                                    step={5}
                                                                />
                                                            </FlexItem>
                                                        </Flex>

                                                        <ToggleControl
                                                            label={__('Center Enlarged Cell', 'icon-grid-unlimited')}
                                                            checked={perTileIconSettings[selectedTile]?.centerCell || false}
                                                            onChange={(v) => updatePerTileSettings(selectedTile, 'centerCell', v)}
                                                        />

                                                        <Flex gap={3} style={{ marginBottom: '8px' }}>
                                                            <FlexItem style={{ flex: 1 }}>
                                                                <RangeControl
                                                                    label={__('Offset X (%)', 'icon-grid-unlimited')}
                                                                    value={perTileIconSettings[selectedTile]?.cellOffsetX || 0}
                                                                    onChange={(v) => updatePerTileSettings(selectedTile, 'cellOffsetX', v)}
                                                                    min={-100}
                                                                    max={100}
                                                                    step={1}
                                                                />
                                                            </FlexItem>
                                                            <FlexItem style={{ flex: 1 }}>
                                                                <RangeControl
                                                                    label={__('Offset Y (%)', 'icon-grid-unlimited')}
                                                                    value={perTileIconSettings[selectedTile]?.cellOffsetY || 0}
                                                                    onChange={(v) => updatePerTileSettings(selectedTile, 'cellOffsetY', v)}
                                                                    min={-100}
                                                                    max={100}
                                                                    step={1}
                                                                />
                                                            </FlexItem>
                                                        </Flex>

                                                        <ToggleControl
                                                            label={__('Scale Label with Cell', 'icon-grid-unlimited')}
                                                            checked={perTileIconSettings[selectedTile]?.scaleLabel || false}
                                                            onChange={(v) => updatePerTileSettings(selectedTile, 'scaleLabel', v)}
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

                                            {/* Logo Explode Transitions */}
                                            <div style={{ marginTop: '20px', padding: '12px', background: '#f0f8ff', borderRadius: '4px', border: '1px solid #b0d4f1' }}>
                                                <ToggleControl
                                                    label={__('Act as Transition Source', 'icon-grid-unlimited')}
                                                    checked={perTileIconSettings[selectedTile]?.isTransitionSource || false}
                                                    onChange={(v) => updatePerTileSettings(selectedTile, 'isTransitionSource', v)}
                                                    help={__('Enable this tile as a source for WP Logo Explode transitions', 'icon-grid-unlimited')}
                                                />
                                                {perTileIconSettings[selectedTile]?.isTransitionSource && (
                                                    <>
                                                        <TextControl
                                                            label={__('Transition ID', 'icon-grid-unlimited')}
                                                            value={perTileIconSettings[selectedTile]?.transitionId || ''}
                                                            onChange={(v) => updatePerTileSettings(selectedTile, 'transitionId', v)}
                                                            placeholder="unique-transition-id"
                                                            help={__('Unique identifier for this transition source', 'icon-grid-unlimited')}
                                                        />
                                                        <RangeControl
                                                            label={__('Explosion Scale (%)', 'icon-grid-unlimited')}
                                                            value={perTileIconSettings[selectedTile]?.transitionScaleExplode || 100}
                                                            onChange={(v) => updatePerTileSettings(selectedTile, 'transitionScaleExplode', v)}
                                                            min={50}
                                                            max={200}
                                                            step={5}
                                                        />
                                                        <PopupColorPicker
                                                            label={__('Explode Background Override', 'icon-grid-unlimited')}
                                                            color={perTileIconSettings[selectedTile]?.transitionColorOverride || ''}
                                                            onChange={(color) => updatePerTileSettings(selectedTile, 'transitionColorOverride', color)}
                                                        />
                                                    </>
                                                )}
                                            </div>
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
                            </Button>
                        </Flex>
                    </Modal>
                )
            }

            {/* Block Editor Modal */}
            {
                blockEditorTile !== null && (
                    <Modal
                        title={__('Edit Block Content', 'icon-grid-unlimited') + ` - Tile ${blockEditorTile + 1}`}
                        onRequestClose={() => setBlockEditorTile(null)}
                        className="icon-grid-block-editor-modal"
                        style={{ maxWidth: '800px', width: '100%', minHeight: '500px' }}
                    >
                        <div style={{ marginBottom: '15px' }}>
                            <p style={{ color: '#666', fontSize: '13px' }}>
                                {__('Add blocks below. They will be rendered inside the tile on the frontend.', 'icon-grid-unlimited')}
                            </p>
                        </div>

                        <div style={{
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            padding: '20px',
                            minHeight: '300px',
                            background: '#fff'
                        }}>
                            <TextareaControl
                                label={__('Block HTML / Shortcode', 'icon-grid-unlimited')}
                                value={tileBlocks[blockEditorTile] || ''}
                                onChange={(v) => updateTileBlock(blockEditorTile, v)}
                                placeholder={__('Paste block HTML, shortcodes, or any HTML content here.\n\nExamples:\n• [my_shortcode]\n• <div class="my-block">Content</div>\n• <!-- wp:image {"id":123} --><figure>...</figure><!-- /wp:image -->', 'icon-grid-unlimited')}
                                rows={12}
                                style={{ fontFamily: 'monospace', fontSize: '12px' }}
                            />
                        </div>

                        <Flex justify="flex-end" style={{ marginTop: '20px' }}>
                            <Button
                                variant="secondary"
                                onClick={() => setBlockEditorTile(null)}
                            >
                                {__('Cancel', 'icon-grid-unlimited')}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => setBlockEditorTile(null)}
                                style={{ marginLeft: '8px' }}
                            >
                                {__('Done', 'icon-grid-unlimited')}
                            </Button>
                        </Flex>
                    </Modal>
                )
            }

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
