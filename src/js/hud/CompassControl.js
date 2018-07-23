
import { HudObject } from './HudObject';
import { Vector2 } from '../Three';

function CompassControl( viewer ) {

	const container = viewer.container;
	const controls = viewer.getControls();

	const point = new Vector2();
	const center = new Vector2();

	var dragging = false;
	var startAngle = 0;

	const hr = HudObject.createHitRegion( HudObject.stdWidth * 2, HudObject.stdWidth * 2, handleEnter );

	hr.style.right = HudObject.stdMargin + 'px';
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
		center.set( bc.left + hr.offsetLeft + HudObject.stdWidth, bc.top + hr.offsetTop + HudObject.stdWidth );
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
		point.set( event.clientX, event.clientY ).sub( center );
		startAngle = point.angle();

	}

	function handleMouseUp ( event ) {

		event.stopPropagation();

		dragging = false;

	}

	function handleDblClick ( event ) {

		event.stopPropagation();

		// select cardinal point from quadrant of control clicked on

		if ( point.x > point.y ) {

			if ( point.x < -point.y ) {

				viewer.azimuthAngle = 0;

			} else {

				viewer.azimuthAngle = Math.PI / 2;

			}

		} else {

			if ( point.x > -point.y ) {

				viewer.azimuthAngle = Math.PI;

			} else {

				viewer.azimuthAngle = 3 * Math.PI / 2;

			}

		}

	}

	function handleMouseMove ( event ) {

		event.stopPropagation();
		event.preventDefault();

		if ( ! dragging ) return;

		point.set( event.clientX, event.clientY ).sub( center );

		const angle = point.angle();

		controls.rotateLeft( startAngle - angle );

		startAngle = angle;

	}

}

export { CompassControl };