
function TerrainMeshLoader ( tileSpec, loadCallback, errorCallback ) {

	if ( ! loadCallback ) alert( 'No callback specified' );

	this.loadCallback  = loadCallback;
	this.errorCallback = errorCallback;

	this.x = tileSpec.x;
	this.y = tileSpec.y;
	this.z = tileSpec.z;

	this.tileFile = tileSpec.url + this.z + '/' + this.x + '/' + this.y + '.terrain';
	this.accessToken = tileSpec.accessToken;

}

TerrainMeshLoader.prototype.constructor = TerrainMeshLoader;

TerrainMeshLoader.prototype.load = function () {

	const self = this;
	const xhr = new XMLHttpRequest();

	//this.tileFile += '?v=1.0.0';

	xhr.addEventListener( 'load', _loaded);
	xhr.addEventListener( 'error', this.errorCallback );

	xhr.open( 'GET', this.tileFile );

	xhr.responseType = 'arraybuffer';
	xhr.setRequestHeader( 'Accept', 'application/vnd.quantized-mesh;extensions=octvertexnormals;q=0.9;access_token=' + this.accessToken );

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