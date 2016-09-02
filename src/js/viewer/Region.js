	var loader = new RegionLoader( _regionLoaded );

	loader.load( "region.js" );

import { Object3D } from '../../../../three.js/src/Three.js';
import { Marker } from './Marker.js';

function Region( regionData ) {

	Object3D.call( this );

	console.dir( regionData );

	var caves = regionData.caves;

	if ( caves === undefined ) { 

		console.log("no caves in region"); 
		return;

	}

	console.dir( caves );

	var caveName;

	for ( caveName in caves )  {

		var cave = caves[ caveName ];

		for ( var i = 0; i < cave.entrances.length; i++ ) {

			var entrance = cave.entrances[i];

			region.add( new Marker( region, entrance ) );

		}

	}

	return this;

}

Region.prototype.constructor = Region;

Object.assign( Region.prototype, Object3D.prototype );


