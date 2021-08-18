
function AHIControl( hudObject, viewer ) {

	const container = viewer.container;
	const controls = viewer.getControls();

	const hr = hudObject.createHitRegion( hudObject.stdWidth * 2, hudObject.stdWidth * 2, handleEnter );
	const ballSize = hudObject.stdWidth - 10;

	let dragging = false;
	let centerY;
	let lastAngle;

	hr.style.right = hudObject.stdMargin * 3 + hudObject.stdWidth * 2 + 'px';
	hr.style.bottom = hudObject.stdMargin + 'px';

	container.appendChild( hr );

	function handleEnter ( event ) {

		if ( ! viewer.HUD ) return;

		const target = event.currentTarget;

		target.addEventListener( 'pointerleave', handleLeave );
		target.addEventListener( 'pointermove',  handleMouseMove );
		target.addEventListener( 'pointerdown',  handleMouseDown );
		target.addEventListener( 'pointerup',    handleMouseUp );
		target.addEventListener( 'dblclick',   handleDblClick );

		// update center position (accounts for resizes)
		const bc = container.getBoundingClientRect();
		centerY = bc.top + hr.offsetTop + hudObject.stdWidth;

		hr.style.cursor = 'pointer';

	}

	function handleLeave ( event ) {

		const target = event.currentTarget;

		if ( dragging ) controls.end();

		target.removeEventListener( 'pointerleave', handleLeave );
		target.removeEventListener( 'pointermove',  handleMouseMove );
		target.removeEventListener( 'pointerdown',  handleMouseDown );
		target.removeEventListener( 'pointerup',    handleMouseUp );
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
		controls.end();

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

	this.dispose = function () {

		container.removeChild( hr );

	};

}

export { AHIControl };