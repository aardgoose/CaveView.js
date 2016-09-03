
import { Box3, Object3D } from '../../../../three.js/src/Three.js';
import { Marker } from './Marker.js';
import { Tree } from '../core/Tree.js';

function Region( regionHandler ) {

	Object3D.call( this );

	var region = regionHandler.getData();

	if ( region.caves === undefined ) { 

		console.log("no caves in region"); 
		return;

	}

	this.limits = new Box3();
	this.mouseTargets = [];
	this.lodTargets = [];

	var min = this.limits.min;
	var max = this.limits.max;

	var caves = region.caves;

	console.dir( caves );

	var caveName;

	for ( caveName in caves )  {

		var cave = caves[ caveName ];

		for ( var i = 0; i < cave.entrances.length; i++ ) {

			var entrance = cave.entrances[i];
			var marker = new Marker( this, entrance );
	
			min.min( entrance.position );
			max.max( entrance.position );

			this.add( marker );

			this.mouseTargets.push( marker );
			this.lodTargets.push( marker );

		}

	}

	return this;

}

Region.prototype.constructor = Region;

Object.assign( Region.prototype, Object3D.prototype );


Region.prototype.getTerrain = function () {

	return null;

}

// stub functions

Region.prototype.getStats = function () {

	return {};

}

Region.prototype.clearSectionSelection = function () {}

Region.prototype.selectSection = function ( id ) {}

Region.prototype.setEntrancesSelected = function ( id ) {}
Region.prototype.setShadingMode = function ( id ) {}
Region.prototype.setLegShading = function ( id ) {}
Region.prototype.getSurveyTree = function ( id ) { return new Tree(); }
Region.prototype.hasFeature = function ( id ) { return false }


export { Region };

