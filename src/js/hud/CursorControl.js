

import { HudObject } from './HudObject';
import { SHADING_CURSOR, SHADING_DEPTH_CURSOR } from '../core/constants';

function CursorControl( viewer, cursorScale ) {

	const container = viewer.container;

	const hr = HudObject.createHitRegion( cursorScale.barWidth, cursorScale.barHeight, handleEnter );

	var dragging = false;
	var barTop;

	hr.style.right = HudObject.stdMargin + 'px';
	hr.style.bottom = cursorScale.barOffset + 'px';

	container.appendChild( hr );

	this.hr = hr;

	function handleEnter ( event ) {

		if ( ! viewer.HUD ) return;
		if ( viewer.shadingMode !== SHADING_CURSOR && viewer.shadingMode !== SHADING_DEPTH_CURSOR ) return;

		const target = event.currentTarget;

		target.addEventListener( 'mouseleave', handleLeave );
		target.addEventListener( 'mousemove',  handleMouseMove );
		target.addEventListener( 'mousedown',  handleMouseDown );
		target.addEventListener( 'mouseup',    handleMouseUp );

		// update center position (accounts for resizes)
		const bc = container.getBoundingClientRect();

		barTop = bc.top + hr.offsetTop;

		hr.style.cursor = 'pointer';

	}

	function setCursor( clientY ) {

		const heightFraction =  ( cursorScale.barHeight - clientY + barTop ) / cursorScale.barHeight;
		const range = viewer.maxHeight - viewer.minHeight;

		// handle direction of scale and range

		if ( viewer.shadingMode === SHADING_DEPTH_CURSOR ) {

			viewer.cursorHeight = range - range * heightFraction;

		} else {

			viewer.cursorHeight = range * heightFraction - range / 2;

		}

	}

	function handleLeave ( event ) {

		const target = event.currentTarget;

		target.removeEventListener( 'mouseleave', handleLeave );
		target.removeEventListener( 'mousemove',  handleMouseMove );
		target.removeEventListener( 'mousedown',  handleMouseDown );
		target.removeEventListener( 'mouseup',    handleMouseUp );

		hr.style.cursor = 'default';
		dragging = false;

	}

	function handleMouseDown ( event ) {

		event.stopPropagation();

		setCursor( event.clientY );
		dragging = true;

	}

	function handleMouseUp ( event ) {

		event.stopPropagation();

		dragging = false;

	}

	function handleMouseMove ( event ) {

		event.stopPropagation();
		event.preventDefault();

		if ( ! dragging ) return;

		setCursor( event.clientY );

	}

}

CursorControl.prototype.dispose = function () {

	const hr = this.hr;
	hr.parentNode.removeChild( hr );

};

export { CursorControl };