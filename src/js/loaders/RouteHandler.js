
import { getEnvironmentValue } from '../core/constants.js';

function RouteHandler ( filename, dataStream ) {

	this.isRoute = true;
	this.data = dataStream;
}

RouteHandler.prototype.constructor = RouteHandler;

RouteHandler.prototype.getSurvey = function () {

	return this.data;

}

export { RouteHandler };

// EOF