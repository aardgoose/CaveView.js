

import { Overlay } from './Overlay';

function MapBoxOverlay ( x, y, z, opacity, overlayLoaded ) {

	var mapBoxAccessToken = 'pk.eyJ1IjoiYWFyZGdvb3NlIiwiYSI6ImNqMWh2dHR2MTAwMXIycW4yMmg2MHJidHcifQ.eenH12R7X8Eq-Ekb_K4dDQ';
	var imageFile = 'https://api.mapbox.com/v4/mapbox.satellite/' + z + '/' + x + '/' + y + '.jpg90?access_token=' + mapBoxAccessToken;

	Overlay.call( this, x, y, z, opacity, overlayLoaded, imageFile );

}

MapBoxOverlay.prototype = Object.create( Overlay.prototype );

MapBoxOverlay.prototype.constructor = MapBoxOverlay;


export { MapBoxOverlay };

