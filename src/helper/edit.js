/**
 * Icon Grid Helper - Editor Component
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls, InnerBlocks } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';

export default function Edit({ attributes, setAttributes }) {
    const { transitionId } = attributes;

    const blockProps = useBlockProps({
        className: 'icon-grid-helper-editor'
    });

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Transition Settings', 'icon-grid-unlimited')} initialOpen={true}>
                    <TextControl
                        label={__('Transition ID', 'icon-grid-unlimited')}
                        value={transitionId}
                        onChange={(v) => setAttributes({ transitionId: v })}
                        help={__('Enter the Transition ID of the grid tile this block should control.', 'icon-grid-unlimited')}
                    />
                </PanelBody>
            </InspectorControls>
            <div {...blockProps}>
                <div style={{
                    border: '2px dashed #ccc',
                    padding: '20px',
                    borderRadius: '8px',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '10px',
                        background: '#007cba',
                        color: '#fff',
                        padding: '2px 8px',
                        fontSize: '10px',
                        borderRadius: '4px',
                        zIndex: 1
                    }}>
                        Helper {transitionId ? `: ${transitionId}` : ''}
                    </div>
                    <InnerBlocks
                        renderAppender={InnerBlocks.ButtonBlockAppender}
                    />
                </div>
            </div>
        </>
    );
}
