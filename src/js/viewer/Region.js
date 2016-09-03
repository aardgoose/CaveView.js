
import { Object3D } from '../../../../three.js/src/Three.js';
import { Marker } from './Marker.js';

function Region( regionHandler ) {

	Object3D.call( this );

	var region = regionHandler.getData();

	if ( region.caves === undefined ) { 

		console.log("no caves in region"); 
		return;

	}
	var caves = region.caves;

	console.dir( caves );

	var caveName;

	for ( caveName in caves )  {

		var cave = caves[ caveName ];

		for ( var i = 0; i < cave.entrances.length; i++ ) {

			var entrance = cave.entrances[i];

			this.add( new Marker( this, entrance ) );

		}

	}

	return this;

}

Region.prototype.constructor = Region;

Object.assign( Region.prototype, Object3D.prototype );

export { Region };

