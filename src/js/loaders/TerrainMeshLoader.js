
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

	//	this.tileFile = 'https://assets.cesium.com/1/' + this.z + '/' + this.x + '/' + this.y + '.terrain';
	this.tileFile = 'https://assets.agi.com/stk-terrain/tilesets/world/tiles/' + this.z + '/' + this.x + '/' + this.y + '.terrain';

}

TerrainMeshLoader.prototype.constructor = TerrainMeshLoader;

TerrainMeshLoader.prototype.load = function () {

	const self = this;
	const xhr = new XMLHttpRequest();
	//const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlZTk5MmVmZC1iZDU5LTQzMWQtOWY0Zi1mZDYxNDA1MTNjMjgiLCJpZCI6OTEwLCJpYXQiOjE1MjYzMjczMDh9.aJWNt5jc-dt64lR4q7zw0bdp0PARsvupmWjUYUrQVQs'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMTdkODUzMi01Y2RlLTRhOWEtYWQwNS05YzRhMWE4OTM3ZTEiLCJpZCI6OTEwLCJhc3NldHMiOnsiMSI6eyJ0eXBlIjoiVEVSUkFJTiIsImV4dGVuc2lvbnMiOlt0cnVlLHRydWUsdHJ1ZV19fSwiaWF0IjoxNTI2Mzc5MTU5LCJleHAiOjE1MjYzODI3NTl9.pSojikilWR74NNxboZyELXjlh4DGC6MGHR3Nub4s0yQ';
	const accessToken =  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMTdkODUzMi01Y2RlLTRhOWEtYWQwNS05YzRhMWE4OTM3ZTEiLCJpZCI6OTEwLCJhc3NldHMiOnsiMSI6eyJ0eXBlIjoiVEVSUkFJTiIsImV4dGVuc2lvbnMiOlt0cnVlLHRydWUsdHJ1ZV19fSwiaWF0IjoxNTI2Mzc5MTU5LCJleHAiOjE1MjYzODI3NTl9.pSojikilWR74NNxboZyELXjlh4DGC6MGHR3Nub4s0yQ';

	xhr.addEventListener( 'load', _loaded);
	xhr.addEventListener( 'error', this.errorCallback );

	xhr.open( 'GET', this.tileFile );

	xhr.responseType = 'arraybuffer';
	xhr.setRequestHeader( 'Accept', 'application/vnd.quantized-mesh;extensions=octvertexnormals;q=0.9;access_token=' + accessToken );

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