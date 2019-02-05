import { Cfg } from '../core/lib';
import { Tree } from '../core/Tree';
import { Box3, Vector3 } from '../Three';

import proj4 from 'proj4';

function Handler( fileName ) {

	this.fileName   = fileName;
	this.surveyTree = new Tree();
	this.limits     = new Box3();
	this.offsets    = new Vector3();
	this.lineSegments = [];
	this.xGroups      = [];
	this.scraps     = [];
	this.terrains   = [];
	this.sourceCRS  = null;
	this.targetCRS  = 'EPSG:3857'; // "web mercator"
	this.displayCRS = null;
	this.projection = null;
	this.hasTerrain  = false;
	this.messages = [];

}

Handler.prototype.setCRS = function ( sourceCRS ) {

	if ( sourceCRS !== null ) {

		// work around lack of +init string support in proj4js

		const matches = sourceCRS.match( /\+init=(.*)\s/ );

		if ( matches && matches.length === 2 ) {

			switch ( matches[ 1 ] ) {

			case 'epsg:27700' :

				sourceCRS = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs';

				break;

			default:

				throw new Error( 'Unsupported projection' );

			}

		}

	}

	const displayCRS = Cfg.value( 'displayCRS', 'EPSG:3857' );

	if ( sourceCRS === null ) sourceCRS = Cfg.value( 'defaultCRS', null );

	// FIXME use NAD grid corrections OSTM15 etc ( UK Centric )
	if ( sourceCRS !== null ) {

		this.sourceCRS = sourceCRS;

		if ( displayCRS === 'ORIGINAL' ) {

			this.displayCRS = 'ORIGINAL';

		} else {

			console.log( 'Reprojecting from', sourceCRS, 'to', this.targetCRS );

			this.projection = proj4( this.sourceCRS, this.targetCRS );
			this.displayCRS = this.targetCRS;

		}

	}

};

Handler.prototype.getSurvey = function () {

	return {
		title: this.fileName,
		surveyTree: this.surveyTree,
		sourceCRS: this.sourceCRS,
		displayCRS: this.displayCRS,
		lineSegments: this.lineSegments,
		crossSections: this.xGroups,
		scraps: this.scraps,
		hasTerrain: this.hasTerrain,
		metadata: this.metadata,
		terrains: this.terrains,
		limits: this.limits,
		offsets: this.offsets
	};

};

export { Handler };

// EOF