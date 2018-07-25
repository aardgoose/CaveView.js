
import { HudObject } from './HudObject';

function AHIControl( viewer ) {

	const container = viewer.container;
	const controls = viewer.getControls();

	const hr = HudObject.createHitRegion( HudObject.stdWidth * 2, HudObject.stdWidth * 2, handleEnter );
	const ballSize = HudObject.stdWidth - 10;
	var dragging = false;
	var centerY;
	var lastAngle;

	hr.style.right = HudObject.stdMargin * 3 + HudObject.stdWidth * 2 + 'px';
	hr.style.bottom = HudObject.stdMargin + 'px';

	container.appendChild( hr );

	function handleEnter ( event ) {

		if ( ! viewer.HUD ) return;

		const target = event.currentTarget;

		target.addEventListener( 'mouseleave', handleLeave );
		target.addEventListener( 'mousemove',  handleMouseMove );
		target.addEventListener( 'mousedown',  handleMouseDown );
		target.addEventListener( 'mouseup',    handleMouseUp );
		target.addEventListener( 'dblclick',   handleDblClick );

		// update center position (accounts for resizes)
		const bc = container.getBoundingClientRect();
		centerY =  bc.top + hr.offsetTop + HudObject.stdWidth;

		hr.style.cursor = 'pointer';

	}

	function handleLeave ( event ) {

		const target = event.currentTarget;

		target.removeEventListener( 'mouseleave', handleLeave );
		target.removeEventListener( 'mousemove',  handleMouseMove );
		target.removeEventListener( 'mousedown',  handleMouseDown );
		target.removeEventListener( 'mouseup',    handleMouseUp );
		target.removeEventListener( 'dblclick',   handleDblClick );

		hr.style.cursor = 'default';
		dragging = false;

	}

	function handleMouseDown ( event ) {

		event.stopPropagation();

		dragging = true;
		lastAngle = Math.atan( ( event.clientY - centerY ) / ballSize );

	}

	function handleMouseUp ( event ) {

		event.stopPropagation();

		dragging = false;

	}

	function handleDblClick ( event ) {

		event.stopPropagation();

		if ( viewer.polarAngle < 0.0001 ) {

			viewer.polarAngle = Math.PI / 2;

		} else {

			viewer.polarAngle = 0;

		}

	}

	function handleMouseMove ( event ) {

		event.stopPropagation();
		event.preventDefault();

		if ( ! dragging ) return;

		const angle = Math.atan( ( event.clientY - centerY ) / ballSize );

		controls.rotateUp( lastAngle - angle );

		lastAngle = angle;

	}

}

export { AHIControl };