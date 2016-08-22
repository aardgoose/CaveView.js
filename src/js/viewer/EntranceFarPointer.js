
import { getEnvironmentValue } from '../core/constants.js';

import {
	Vector3, Color,
	Geometry,
	TextureLoader,
	PointsMaterial,
	Points
} from '../../../../three.js/src/Three.js';

function EntranceFarPointer () {

	var geometry  = new Geometry();
	var loader  = new TextureLoader();

	var texture  = loader.load( getEnvironmentValue( "cvDirectory", "" ) + "CaveView/images/marker-yellow.png" );

	var material = new PointsMaterial( { size: 10, map: texture, transparent : true, sizeAttenuation: false } );

	geometry.vertices.push( new Vector3( 0, 0, 10 ) );
	geometry.colors.push( new Color( 0xff00ff ) );

	this.type = "CV.EntranceFarPointer";

	var point = Points.call( this, geometry, material );

}

EntranceFarPointer.prototype = Object.create( Points.prototype );

EntranceFarPointer.prototype.constructor = EntranceFarPointer;

export { EntranceFarPointer };

// EOF