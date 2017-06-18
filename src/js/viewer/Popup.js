
import { Vector3 } from '../../../../three.js/src/Three';

function Popup( cssClass ) {

	this.div = document.createElement( 'div' );
	this.div.classList.add( cssClass );

}

Popup.prototype.constructor = Popup;

Popup.prototype.display = function ( container, x, y, camera, p ) {

	var div = this.div;
	var screenPosition = new Vector3();

	div.style.left = x + 'px';
	div.style.top = y + 'px';

	container.appendChild ( div );

	container.addEventListener( 'mouseup', _mouseUp );
	container.addEventListener( 'mousemove', _mouseMove );

	function _mouseMove ( /* event */ ) {

		camera.updateMatrixWorld();

		screenPosition.copy( p );
		screenPosition.project( camera );

		var X = container.clientWidth * ( screenPosition.x + 1 ) / 2;
		var Y = container.clientHeight * ( -screenPosition.y + 1 ) / 2;


		if ( X + div.clientWidth > container.clientWidth || Y + div.clientHeight > container.clientHeight ) {

			// moving off screen, delete now.
			_mouseUp();

		} else {

			div.style.left = X + 'px';
			div.style.top =  Y + 'px';

		}

	}

	function _mouseUp ( /* event */ ) {

		container.removeChild( div );

		container.removeEventListener( 'mousemove', _mouseMove );
		container.removeEventListener( 'mouseup', _mouseUp );

	}

};

Popup.prototype.addLine = function ( line ) {

	var newLine = document.createElement( 'div' );

	newLine.textContent = line;

	this.div.appendChild ( newLine );

	return this;

};

export { Popup };
