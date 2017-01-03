
import { padDigits } from '../core/lib';

function HeightMapLoader ( tileSet, resolution, x, y, loadCallback, errorCallback ) {

	if ( !loadCallback ) alert( "No callback specified" );

	var prefix = tileSet.PREFIX + resolution + "M" + tileSet.TILESIZE + "-";

	this.loadCallback  = loadCallback;
	this.errorCallback = errorCallback;
	this.x = x;
	this.y = y;
	this.tileFile = prefix + padDigits( y, 3 ) + "-" + padDigits( x, 3 ) + ".bin";
	this.basedir = tileSet.BASEDIR;

}

HeightMapLoader.prototype.constructor = HeightMapLoader;

HeightMapLoader.prototype.load = function () {

	var self = this;
	var xhr;

	// console.log( "loading: ", this.tileFile );

	xhr = new XMLHttpRequest();

	xhr.addEventListener( "load", _loaded);
	xhr.addEventListener( "error", this.errorCallback );

	xhr.open( "GET", this.basedir + this.tileFile );
	xhr.responseType = "arraybuffer"; // Must be after open() to keep IE happy.

	xhr.send();

	return true;

	function _loaded ( request ) {

		if (xhr.status === 200) {

			self.loadCallback( xhr.response, self.x, self.y );

		} else {

			self.errorCallback( xhr.response, self.x, self.y );

		}
	}
}

export { HeightMapLoader };

// EOF