import { Overlay } from './Overlay';

function OSMOverlay ( x, y, z, opacity, overlayLoaded ) {

	var imageFile = 'https://b.tile.openstreetmap.org/' + z + '/' + x + '/' + y + '.png';

	Overlay.call( this, x, y, z, opacity, overlayLoaded, imageFile );

}

OSMOverlay.prototype = Object.create( Overlay.prototype );

OSMOverlay.prototype.constructor = OSMOverlay;


export { OSMOverlay };