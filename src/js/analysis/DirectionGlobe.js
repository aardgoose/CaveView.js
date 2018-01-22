
import  {
	Points, SphereBufferGeometry, MeshBasicMaterial, Mesh, Geometry, Vector3, BufferGeometry, Float32BufferAttribute,
} from '../../../../three.js/src/Three';

import  { ExtendedPointsMaterial } from '../materials/ExtendedPointsMaterial';

import { ColourCache } from '../core/ColourCache';

function DirectionGlobe ( survey ) {

	const geometry = new Geometry();
	const bufferGeometry = new BufferGeometry();

	Points.call( this, bufferGeometry, new ExtendedPointsMaterial() );

	this.type = 'DirectionGlobe';

	const self = this;

	this.sphere = new Mesh( new SphereBufferGeometry( 39.9, 20, 20 ), new MeshBasicMaterial( { color: 0x000000 } ) );

	this.add(  this.sphere );

	const stats = survey.getStats();
	const vertices = survey.getLegs();
	const l = vertices.length;

	const colours = ColourCache.gradient;
	const bias = colours.length - 1;

	const pSize = [];

	var i;

	for ( i = 0; i < l; i += 2 ) {

		const legVector = new Vector3().subVectors( vertices[ i ], vertices[ i + 1 ] );

		const rLength = ( legVector.length() - stats.minLegLength ) / stats.legLengthRange;

		const c = Math.max( 0, 2 * ( 1 + Math.log(  rLength * 10 ) * Math.LOG10E ) );

		pSize.push( c );
		pSize.push( c );

		const color = colours[ Math.max( 0, Math.floor( bias * ( 1 + Math.log(  rLength * 10 ) * Math.LOG10E ) / 2 ) ) ];

		legVector.setLength( 41 - rLength  );

		geometry.vertices.push( legVector.clone().negate() );
		geometry.vertices.push( legVector );

		geometry.colors.push( color );
		geometry.colors.push( color );

	}

	const positions = new Float32BufferAttribute( geometry.vertices.length * 3, 3 );
	const colors = new Float32BufferAttribute( geometry.colors.length * 3, 3 );

	bufferGeometry.addAttribute( 'pSize', new Float32BufferAttribute( pSize, 1 ) );
	bufferGeometry.addAttribute( 'position', positions.copyVector3sArray( geometry.vertices ) );
	bufferGeometry.addAttribute( 'color', colors.copyColorsArray( geometry.colors ) );

	survey.addEventListener( 'removed', _onSurveyRemoved );

	function _onSurveyRemoved( event ) {

		const survey = event.target;

		survey.removeEventListener( 'removed', _onSurveyRemoved );

		self.geometry.dispose();
		self.sphere.geometry.dispose();

	}

}

DirectionGlobe.prototype = Object.create( Points.prototype );

DirectionGlobe.prototype.constructor = DirectionGlobe;

export { DirectionGlobe };
