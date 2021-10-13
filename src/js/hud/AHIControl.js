import { Control } from './Control';

class AHIControl extends Control {

	constructor ( hudObject, viewer ) {

		const dim = hudObject.stdWidth * 2;

		super( viewer.container, dim, dim, handleEnter );

		const controls = viewer.getControls();

		const hr = this.hitRegion;
		const ballSize = hudObject.stdWidth - 10;

		let dragging = false;
		let centerY;
		let lastAngle;

		this.positionHitRegion( hudObject.stdMargin * 3 + hudObject.stdWidth * 2, hudObject.stdMargin );

		const handlers = {
			mouseleave: handleLeave,
			mousemove:  handleMouseMove,
			mousedown:  handleMouseDown,
			mouseup:    handleMouseUp,
//			click:      handleClick,
			dblclick:   handleDblClick,
		};

		const self = this;

		function handleEnter ( event ) {

			if ( ! viewer.HUD ) return;

			self.commonEnter( event.currentTarget, handlers );

			// update center position (accounts for resizes)
			const bc = self.rect;

			centerY = bc.top + hr.offsetTop + hudObject.stdWidth;
			dragging = false;

		}

		function handleLeave ( event ) {

			if ( dragging ) controls.end();

			self.commonLeave( event.currentTarget, handlers );

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

		function handleClick ( event ) {

			event.stopPropagation();

			if ( viewer.polarAngle < 0.0001 ) {

				viewer.polarAngle = Math.PI / 2;

			} else {

				viewer.polarAngle = 0;

			}

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

}

export { AHIControl };