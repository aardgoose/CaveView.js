
import  {
	Points, VertexColors, SphereBufferGeometry, MeshBasicMaterial, Mesh, Geometry, Vector3, BufferGeometry, Float32BufferAttribute,
} from '../../../../three.js/src/Three'; 

import  { ExtendedPointsMaterial } from '../materials/ExtendedPointsMaterial'; 

import { ColourCache } from '../core/ColourCache';

function DirectionGlobe ( survey ) {

	var geometry = new Geometry();
	var bufferGeometry = new BufferGeometry();

	Points.call( this, bufferGeometry, new ExtendedPointsMaterial( { size: 1.0, opacity: 0.5, transparent: true,  vertexColors: VertexColors  } ) );

	this.type = 'DirectionGlobe';

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

	var pSize = [];

	for ( var i = 0; i < l; i += 2 ) {

		legVector = new Vector3().subVectors( vertices[ i ], vertices[ i + 1 ] );

		rLength = ( legVector.length() - stats.minLegLength ) / stats.legLengthRange;

		var c = Math.max( 0, 2 * ( 1 + Math.log(  rLength * 10 ) * Math.LOG10E ) );
	
		pSize.push( c );
		pSize.push( c );

		color = colours[ Math.max( 0, Math.floor( bias * ( 1 + Math.log(  rLength * 10 ) * Math.LOG10E ) / 2 ) ) ];

		legVector.setLength( 41 - rLength  );

		geometry.vertices.push( legVector.clone().negate() );
		geometry.vertices.push( legVector );

		geometry.colors.push( color );
		geometry.colors.push( color );

	}

	var positions = new Float32BufferAttribute( geometry.vertices.length * 3, 3 );
	var colors = new Float32BufferAttribute( geometry.colors.length * 3, 3 );

	bufferGeometry.addAttribute( 'pSize', new Float32BufferAttribute( pSize, 1 ) );
	bufferGeometry.addAttribute( 'position', positions.copyVector3sArray( geometry.vertices ) );
	bufferGeometry.addAttribute( 'color', colors.copyColorsArray( geometry.colors ) );

	survey.addEventListener( 'removed', _onSurveyRemoved );

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
