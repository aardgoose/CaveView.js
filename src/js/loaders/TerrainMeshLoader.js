
function TerrainMeshLoader ( tileSpec, loadCallback, errorCallback ) {

	if ( ! loadCallback ) alert( 'No callback specified' );

	const tileSet = tileSpec.tileSet;
	const clip = tileSpec.clip;

	this.loadCallback  = loadCallback;
	this.errorCallback = errorCallback;

	if ( tileSpec.z > tileSet.dtmMaxZoom ) {

		const scale = Math.pow( 2, tileSpec.z - tileSet.dtmMaxZoom );

		this.x = Math.floor( tileSpec.x / scale );
		this.y = Math.floor( tileSpec.y / scale );
		this.z = tileSet.dtmMaxZoom;

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
	this.z = 4;
	this.x = 1;
	this.y = 1;

	this.tileFile = 'https://assets.agi.com/stk-terrain/tilesets/world/tiles/' + this.z + '/' + this.x + '/' + this.y + '.terrain';

}

TerrainMeshLoader.prototype.constructor = TerrainMeshLoader;

TerrainMeshLoader.prototype.load = function () {

	const self = this;
	const xhr = new XMLHttpRequest();

	xhr.addEventListener( 'load', _loaded);
	xhr.addEventListener( 'error', this.errorCallback );

	xhr.open( 'GET', this.tileFile );

	xhr.responseType = 'arraybuffer';
	xhr.setRequestHeader( 'Accept', 'application/vnd.quantized-mesh,application/octet-stream;q=0.9' );

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

export { TerrainMeshLoader };

// EOF