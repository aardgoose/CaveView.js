
import { getEnvironmentValue } from '../core/constants.js';

function RegionHandler ( filename, dataStream ) {

	this.isRegion = true;
	this.data = dataStream;

}

RegionHandler.prototype.constructor = RegionHandler;

RegionHandler.prototype.getData = function () {

	return this.data;

}


export { RegionHandler };

// EOF