
import { HudObject } from './HudObject';

import {
	Vector3, Math as _Math, Face3, Color,
	Geometry, RingGeometry, CylinderBufferGeometry,
	MeshBasicMaterial, MeshPhongMaterial, MeshLambertMaterial,
	FrontSide, VertexColors,
	Mesh, Group, FlatShading
} from '../../../../three.js/src/Three';

function Compass ( container ) {

	var stdWidth  = HudObject.stdWidth;
	var stdMargin = HudObject.stdMargin;

	Group.call( this );

	this.name = 'CV.Compass';
	this.domObjects = [];

	var cg1 = new CylinderBufferGeometry( stdWidth * 0.90, stdWidth, 3, 32, 1, true );
	cg1.rotateX( Math.PI / 2 );

	var c1 = new Mesh( cg1, new MeshPhongMaterial( { color: 0x888888, specular: 0x888888 } ) );

	var cg2 = new RingGeometry( stdWidth * 0.9, stdWidth, 4, 1, -Math.PI / 32 + Math.PI / 2, Math.PI / 16 );
	cg2.translate( 0, 0, 5 );

	var c2 = new Mesh( cg2, new MeshBasicMaterial( { color: 0xb03a14 } ) );

	var r1 = _makeRose( stdWidth * 0.8, 0.141, 0x581d0a, 0x0c536a );
	var r2 = _makeRose( stdWidth * 0.9, 0.141, 0xb03a14, 0x1ab4e5 );

	r1.rotateZ( Math.PI / 4 );
	r1.merge( r2 );

	var rMesh = new Mesh( r1, new MeshLambertMaterial( { vertexColors: VertexColors, side: FrontSide, shading: FlatShading } ) );

	this.add( c1 );
	this.add( c2 );
	this.add( rMesh );

	var offset = stdWidth + stdMargin;

	this.translateX( -offset );
	this.translateY(  offset );

	this.lastRotation = 0;

	var panel = document.createElement( 'div' );

	panel.classList.add( 'cv-compass' );
	panel.textContent = '';

	container.appendChild( panel );

	this.txt = panel;
	this.domObjects.push( panel );

	this.addEventListener( 'removed', this.removeDomObjects );
	this.txt.textContent = '000\u00B0';

	return this;

	// make 'petal' for compass rose
	function _makePetal ( radius, scale, color1, color2 ) {

		var innerR = radius * scale;
		var g = new Geometry();

		g.vertices.push( new Vector3( 0, radius, 0 ) );
		g.vertices.push( new Vector3( innerR ,innerR, 0 ) );
		g.vertices.push( new Vector3( 0, 0, 14 * scale ) );
		g.vertices.push( new Vector3( -innerR, innerR, 0 ) );

		var f1 = new Face3( 0, 2, 1, new Vector3( 0, 0, 1 ), color1, 0 );
		var f2 = new Face3( 0, 3, 2, new Vector3( 0, 0, 1 ), color2, 0 );

		g.faces.push( f1 );
		g.faces.push( f2 );

		return g;

	}

	function _makeRose ( radius, scale, color1, color2 ) {

		var p1 = _makePetal( radius, scale, new Color( color1 ), new Color( color2 ) );
		var p2 = p1.clone();
		var p3 = p1.clone();
		var p4 = p1.clone();

		p2.rotateZ( Math.PI / 2 );
		p3.rotateZ( Math.PI );
		p4.rotateZ( Math.PI / 2 * 3 );

		p1.merge( p2 );
		p1.merge( p3 );
		p1.merge( p4 );

		p1.computeFaceNormals();

		return p1;

	}

}

Compass.prototype = Object.create( Group.prototype );

Object.assign( Compass.prototype, HudObject.prototype );

Compass.prototype.constructor = Compass;

Compass.prototype.set = function () {

	var direction     = new Vector3();
	var yAxis         = new Vector3( 0, 1, 0 );
	var negativeZAxis = new Vector3( 0, 0, -1 );

	return function set ( vCamera ) {

		vCamera.getWorldDirection( direction );

		if ( direction.x === 0 && direction.y === 0 ) {

			// FIXME get camera rotation....
			return;

		}

		// we are only interested in angle to horizontal plane.
		direction.z = 0;

		var a = direction.angleTo( yAxis );

		if ( direction.x >= 0 ) a = 2 * Math.PI - a;

		if ( a === this.lastRotation ) return;

		var degrees = 360 - Math.round( _Math.radToDeg( a ) );

		this.txt.textContent = degrees.toString().padStart( 3, '0' ) + '\u00B0'; // unicode degree symbol

		this.rotateOnAxis( negativeZAxis, a - this.lastRotation );

		this.lastRotation = a;

	};

} ();

export { Compass };

// EOF