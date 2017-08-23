
function HeightMapLoader ( tileSpec, loadCallback, errorCallback ) {

	if ( ! loadCallback ) alert( 'No callback specified' );

	var tileSet = tileSpec.tileSet;
	var clip = tileSpec.clip;

	this.loadCallback  = loadCallback;
	this.errorCallback = errorCallback;

	if ( tileSpec.z > tileSet.dtmMaxZoom ) {

		var scale = Math.pow( 2, tileSpec.z - tileSet.dtmMaxZoom );

		this.x = Math.floor( tileSpec.x / scale );
		this.y = Math.floor( tileSpec.y / scale );
		this.z = tileSet.dtmMaxZoom;

		// calculate offset in terrain cells of covering DTM tile for this smaller image tile.

		var divisions = tileSet.divisions;

		var dtmOffsetX =  ( divisions * ( tileSpec.x % scale ) ) / scale;
		var dtmOffsetY =  ( divisions + 1 ) * ( divisions * ( tileSpec.y % scale ) ) / scale;

		clip.dtmOffset = dtmOffsetY + dtmOffsetX;
		clip.dtmWidth = tileSet.divisions + 1;

	} else {

		this.x = tileSpec.x;
		this.y = tileSpec.y;
		this.z = tileSpec.z;

		clip.dtmOffset = 0;


	}

	this.tileFile = tileSet.directory + '/' + this.z + '/DTM-' + this.x + '-' + this.y + '.bin';

}

HeightMapLoader.prototype.constructor = HeightMapLoader;

HeightMapLoader.prototype.load = function () {

	var self = this;
	var xhr;

	xhr = new XMLHttpRequest();

	xhr.addEventListener( 'load', _loaded);
	xhr.addEventListener( 'error', this.errorCallback );

	xhr.open( 'GET', this.tileFile );
	xhr.responseType = 'arraybuffer';

	xhr.send();

	return true;

	function _loaded ( /* request */ ) {

		if (xhr.status === 200) {

			self.loadCallback( xhr.response, self.x, self.y );

		} else {

			self.errorCallback( xhr.response, self.x, self.y );

		}

	}

};

export { HeightMapLoader };

// EOF