import { Control } from './Control';

const d30 = Math.PI / 6;

class AHIControl extends Control {

	constructor ( hudObject, viewer ) {

		const dim = hudObject.stdWidth * 2;

		super( viewer.container, dim, dim, handleEnter );

		const controls = viewer.getControls();

		const ballSize = hudObject.stdWidth - 10;

		let dragging = false;
		let dragged = false;
		let centerY;
		let lastAngle;

		this.positionHitRegion( hudObject.stdMargin * 3 + hudObject.stdWidth * 2, hudObject.stdMargin );

		const handlers = {
			pointerleave: handleLeave,
			pointermove:  handlePointerMove,
			pointerdown:  handlePointerDown,
			pointerup:    handlePointerUp,
		};

		const self = this;

		function handleEnter ( event ) {

			if ( ! viewer.HUD ) return;

			self.commonEnter( event.currentTarget, handlers );

			// update center position (accounts for resizes)
			centerY = self.rect.top +  hudObject.stdWidth;
			dragging = false;

		}

		function handleLeave ( event ) {

			self.commonLeave( event.currentTarget, handlers );

		}

		function handlePointerDown ( event ) {

			event.stopPropagation();

			dragging = true;
			dragged = false;

			lastAngle = Math.atan( ( event.clientY - centerY ) / ballSize );
			self.hitRegion.setPointerCapture( event.pointerId );

		}

		function handlePointerUp ( event ) {

			event.stopPropagation();

			if ( ! dragged ) {

				const dir = Math.sign( event.clientY - centerY );

				// round to nearest 30 degrees and inc/dec by 30 degrees. clamping in orbit control.
				viewer.polarAngle = d30 * ( Math.round( viewer.polarAngle / d30 ) + dir );

			}

			controls.end();
			self.hitRegion.releasePointerCapture( event.pointerId );

			dragging = false;

		}

		function handlePointerMove ( event ) {

			event.stopPropagation();
			event.preventDefault();

			if ( ! dragging ) return;

			const angle = Math.atan( ( event.clientY - centerY ) / ballSize );

			controls.rotateUp( lastAngle - angle );

			lastAngle = angle;
			dragged = true;

		}

	}

}

export { AHIControl };