
import { HudObject } from './HudObject';
import { Colours } from '../core/Colours';
import {
	Vector3, Color,
	RingGeometry,
	MeshBasicMaterial,
	VertexColors, FrontSide,
	Mesh
} from '../../../../three.js/src/Three';

function AngleScale ( container ) {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	var stdWidth  = HudObject.stdWidth;
	var stdMargin = HudObject.stdMargin;

	var i, l;

	var geometry = new RingGeometry( 1, 40, 36, 1, Math.PI, Math.PI );
	var c = [];

	var pNormal = new Vector3( 1, 0, 0 );
	var hues = Colours.inclinationColours;

	var vertices = geometry.vertices;
	var legNormal = new Vector3();

	for ( i = 0, l = vertices.length; i < l; i++ ) {

		legNormal.copy( vertices[ i ] ).normalize();

		var dotProduct = legNormal.dot( pNormal );
		var hueIndex = Math.floor( 127 * 2 * Math.asin( Math.abs( dotProduct ) ) / Math.PI );

		c[ i ] = new Color( hues[ hueIndex ] );

	}

	var faces = geometry.faces, f;

	for ( i = 0, l = faces.length; i < l; i++ ) {

		f = faces[ i ];

		f.vertexColors = [ c[ f.a ], c[ f.b ], c[ f.c ] ];

	}

	geometry.colorsNeedUpdate = true;

	Mesh.call( this, geometry, new MeshBasicMaterial( { color: 0xffffff, vertexColors: VertexColors, side: FrontSide } ) );

	this.translateY( -height / 2 + 3 * ( stdWidth + stdMargin ) + stdMargin + 30 );
	this.translateX(  width / 2 - 40 - 5 );

	this.name = 'CV.AngleScale';
	this.domObjects = [];

	var legend = document.createElement( 'div' );

	legend.id = 'angle-legend';
	legend.textContent = 'Inclination';

	container.appendChild( legend );

	this.txt = legend;
	this.domObjects.push( legend );

	this.addEventListener( 'removed', this.removeDomObjects );

	return this;

}

AngleScale.prototype = Object.create( Mesh.prototype );

Object.assign( AngleScale.prototype, HudObject.prototype );

AngleScale.prototype.constructor = AngleScale;

export { AngleScale };

// EOF