
import { Overlay } from './Overlay';

function NLSOverlay ( x, y, z, opacity, overlayLoaded ) {

	var imageFile = NLSTileUrlOS( x, y, z ); // eslint-disable-line no-undef

	Overlay.call( this, x, y, z, opacity, overlayLoaded, imageFile );

}

NLSOverlay.prototype = Object.create( Overlay.prototype );

NLSOverlay.prototype.constructor = NLSOverlay;


export { NLSOverlay };