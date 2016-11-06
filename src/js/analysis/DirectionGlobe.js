
import  {
	Points, PointsMaterial, VertexColors, SphereBufferGeometry, MeshBasicMaterial, Mesh, Geometry, Vector3
} from '../../../../three.js/src/Three.js'; 

import { ColourCache } from '../core/ColourCache.js';

function DirectionGlobe ( survey ) {

	var geometry = new Geometry();

	Points.call( this, geometry, new PointsMaterial( { size: 1.0, opacity: 0.5, transparent: true,  vertexColors: VertexColors  } ) );

	this.type = "DirectionGlobe";

	var self = this;

	this.sphere = new Mesh( new SphereBufferGeometry( 39.9, 20, 20 ), new MeshBasicMaterial( { color: 0x000000 } ) );

	this.add(  this.sphere );

	var stats = survey.getStats();
	var vertices = survey.getLegs();

	var colours = ColourCache.gradient;
	var bias = colours.length - 1;

	var legVector;
	var rLength, color;

	var l = vertices.length;

	for ( var i = 0; i < l; i += 2 ) {

		legVector = new Vector3().subVectors( vertices[ i ], vertices[ i + 1 ] );

		rLength = ( legVector.length() - stats.minLegLength ) / stats.legLengthRange;

		color = colours[ Math.max( 0, Math.floor( bias * ( 1 + Math.log(  rLength * 10 ) * Math.LOG10E ) / 2 ) ) ];

		legVector.setLength( 40 );

		geometry.vertices.push( legVector.clone().negate() );
		geometry.vertices.push( legVector );

		geometry.colors.push( color );
		geometry.colors.push( color );

	}

	survey.addEventListener( "removed", _onSurveyRemoved );

	function _onSurveyRemoved( event ) {

		var survey = event.target;

		survey.removeEventListener( 'removed', _onSurveyRemoved );

		self.geometry.dispose();
		self.sphere.geometry.dispose();

	}

}

DirectionGlobe.prototype = Object.create( Points.prototype );

DirectionGlobe.prototype.constructor = DirectionGlobe;

export { DirectionGlobe };
