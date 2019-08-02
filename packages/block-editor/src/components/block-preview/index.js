/**
 * External dependencies
 */
import { castArray } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { useLayoutEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockEditorProvider from '../provider';
import BlockList from '../block-list';
import { getBlockPreviewContainerDOMNode } from '../../utils/dom';

export function BlockPreview( { blocks, settings } ) {
	blocks = castArray( blocks );

	const previewRef = useRef( null );

	const [ previewScale, setPreviewScale ] = useState( 1 );
	const [ visibility, setVisibility ] = useState( 'hidden' );

	// Dynamically calculate the scale factor
	useLayoutEffect( () => {
		const blockClientIds = blocks.map( ( block ) => block.clientId );

		// Timer - required to account for async render of `BlockEditorProvider`
		const timerId = setTimeout( () => {
			window.clearTimeout( timerId );
			const refNode = previewRef.current;

			if ( ! refNode ) {
				return;
			}

			// Detect any offset on the preview content as we will need to account for that in the "width"
			// calcultions below
			const previewContentComputed = window.getComputedStyle( refNode.firstChild );
			const previewContentOffset = parseFloat( previewContentComputed.top ) + parseFloat( previewContentComputed.left );

			// Determine the rendered width of the container
			const previewContainerWidth = refNode.offsetWidth - previewContentOffset;

			const comparisonBlockWidth = blockClientIds.reduce( ( acc, currClientId ) => {
				// Selector scoped to `refNode` to avoid global selector being ambiguous in the case
				// of multiple previews on the same view
				const previewDomElement = getBlockPreviewContainerDOMNode( currClientId, refNode );

				if ( previewDomElement && previewDomElement.offsetWidth > acc ) {
					acc = previewDomElement.offsetWidth;
				}
				return acc;
			}, previewContainerWidth );

			const scale = Math.min( previewContainerWidth / comparisonBlockWidth ) || 1;

			setPreviewScale( scale );
			setVisibility( 'visible' );
		}, 10 );

		// Cleanup
		return () => {
			if ( timerId ) {
				window.clearTimeout( timerId );
			}
		};
	} );

	if ( ! blocks ) {
		return null;
	}

	const previewStyles = {
		transform: `scale(${ previewScale })`,
		visibility,
	};

	const contentClassNames = classnames( 'editor-block-preview__content block-editor-block-preview__content editor-styles-wrapper', {
		'is-scaled': previewScale !== 1,
	} );

	return (
		<div ref={ previewRef } className="editor-block-preview__container" aria-hidden>
			<Disabled style={ previewStyles } className={ contentClassNames }>
				<BlockEditorProvider
					value={ blocks }
					settings={ settings }
				>
					<BlockList />
				</BlockEditorProvider>
			</Disabled>
		</div>
	);
}

/**
 * BlockPreview renders a preview given an array of blocks.
 *
 * @param {Object} props Component props.
 *
 * @return {WPElement} Rendered element.
 */
export default withSelect( ( select ) => {
	return {
		settings: select( 'core/block-editor' ).getSettings(),
	};
} )( BlockPreview );