import { Control } from './Control';
import { SHADING_CURSOR, SHADING_DEPTH_CURSOR } from '../core/constants';

class CursorControl extends Control {

	constructor ( hudObject, viewer, cursorScale ) {

		super( viewer.container, cursorScale.barWidth, cursorScale.barHeight, handleEnter );

		let dragging = false;
		let barTop;

		this.positionHitRegion( hudObject.stdMargin, cursorScale.barOffset );

		const handlers = {
			pointerleave: handleLeave,
			pointermove:  handlePointerMove,
			pointerdown:  handlePointerDown,
			pointerup:    handlePointerUp
		};

		const self = this;

		function handleEnter ( event ) {

			if ( ! viewer.HUD ) return;
			if ( viewer.shadingMode !== SHADING_CURSOR && viewer.shadingMode !== SHADING_DEPTH_CURSOR ) return;

			self.commonEnter( event.currentTarget, handlers );

			// update center position (accounts for resizes)

			barTop = self.rect.top;
			dragging = false;

		}

		function setCursor( clientY ) {

			const heightFraction = ( cursorScale.barHeight - clientY + barTop ) / cursorScale.barHeight;
			const range = viewer.maxHeight - viewer.minHeight;

			// handle direction of scale and range

			if ( viewer.shadingMode === SHADING_DEPTH_CURSOR ) {

				viewer.cursorHeight = range - range * heightFraction;

			} else {

				viewer.cursorHeight = range * heightFraction - range / 2;

			}

		}

		function handleLeave ( event ) {

			self.commonLeave( event.currentTarget, handlers );

		}

		function handlePointerDown ( event ) {

			event.stopPropagation();

			setCursor( event.clientY );
			dragging = true;

		}

		function handlePointerUp ( event ) {

			event.stopPropagation();

			dragging = false;

		}

		function handlePointerMove ( event ) {

			event.stopPropagation();
			event.preventDefault();

			if ( ! dragging ) return;

			setCursor( event.clientY );

		}

	}

}

export { CursorControl };