/**
 * Icon Grid Helper - Save Component
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save() {
    return (
        <div {...useBlockProps.save()}>
            <InnerBlocks.Content />
        </div>
    );
}
