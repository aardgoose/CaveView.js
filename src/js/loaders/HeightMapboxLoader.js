
function HeightMapboxLoader ( tileSpec, loadCallback, errorCallback ) {

	if ( ! loadCallback ) alert( 'No callback specified' );

	const tileSet = tileSpec.tileSet;
	const clip = tileSpec.clip;

	this.loadCallback  = loadCallback;
	this.errorCallback = errorCallback;

	if ( tileSpec.z > tileSet.maxZoom ) {

		const scale = Math.pow( 2, tileSpec.z - tileSet.maxZoom );

		this.x = Math.floor( tileSpec.x / scale );
		this.y = Math.floor( tileSpec.y / scale );
		this.z = tileSet.maxZoom;

		// calculate offset in terrain cells of covering DTM tile for this smaller image tile.

		const divisions = tileSet.divisions;

		const dtmOffsetX = ( divisions * ( tileSpec.x % scale ) ) / scale;
		const dtmOffsetY = ( divisions + 1 ) * ( divisions * ( tileSpec.y % scale ) ) / scale;

		clip.dtmOffset = dtmOffsetY + dtmOffsetX;
		clip.dtmWidth = tileSet.divisions + 1;

	} else {

		this.x = tileSpec.x;
		this.y = tileSpec.y;
		this.z = tileSpec.z;

		clip.dtmOffset = 0;


	}

	const accessToken = 'pk.eyJ1IjoiYWFyZGdvb3NlIiwiYSI6ImNqMWh2dHR2MTAwMXIycW4yMmg2MHJidHcifQ.eenH12R7X8Eq-Ekb_K4dDQ';
	tileSet.directory = 'https://api.mapbox.com/v4/mapbox.terrain-rgb';

	this.tileFile = tileSet.directory + '/' + this.z + '/' + this.x + '/' + this.y + '.pngraw?access_token=' + accessToken;

}

HeightMapboxLoader.prototype.constructor = HeightMapboxLoader;

HeightMapboxLoader.prototype.load = function () {

	const self = this;
	const xhr = new XMLHttpRequest();

	xhr.addEventListener( 'load', _loaded);
	xhr.addEventListener( 'error', this.errorCallback );

	xhr.open( 'GET', this.tileFile );
	xhr.responseType = 'arraybuffer';

	xhr.send();

	return true;

	function _loaded ( /* request */ ) {

		if (xhr.status === 200) {

			self.loadCallback( xhr.response );

		} else {

			if ( xhr.response.byteLength == 33 ) {

				self.loadCallback( null );

			} else {

				self.errorCallback( xhr.response );

			}

		}

	}

};

export { HeightMapboxLoader };

// EOF