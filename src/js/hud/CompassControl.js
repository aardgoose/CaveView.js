import { Vector2 } from '../Three';

function CompassControl( hudObject, viewer ) {

	const container = viewer.container;
	const controls = viewer.getControls();

	const point = new Vector2();
	const center = new Vector2();

	let dragging = false;
	let startAngle = 0;

	const hr = hudObject.createHitRegion( hudObject.stdWidth * 2, hudObject.stdWidth * 2, handleEnter );

	hr.style.right = hudObject.stdMargin + 'px';
	hr.style.bottom = hudObject.stdMargin + 'px';

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
		center.set( bc.left + hr.offsetLeft + hudObject.stdWidth, bc.top + hr.offsetTop + hudObject.stdWidth );
		hr.style.cursor = 'pointer';

	}

	function handleLeave ( event ) {

		const target = event.currentTarget;

		if ( dragging ) controls.end();

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

		controls.end();

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

	this.dispose = function () {

		container.removeChild( hr );

	};

}

export { CompassControl };