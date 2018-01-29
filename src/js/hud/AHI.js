
import { upAxis } from '../core/constants';
import { HudObject } from './HudObject';
import { Cfg } from '../core/lib';

import {
	Vector3, Math as _Math,
	Geometry, SphereBufferGeometry, BufferAttribute, CylinderBufferGeometry,
	LineBasicMaterial, MeshPhongMaterial,
	VertexColors,
	Mesh, LineSegments, Group
} from '../Three';

function AHI ( container ) {

	const stdWidth  = HudObject.stdWidth;
	const stdMargin = HudObject.stdMargin;

	const c1 = Cfg.themeColor( 'hud.ahi.sky' );
	const c2 = Cfg.themeColor( 'hud.ahi.earth' );

	Group.call( this );

	this.name = 'CV.AHI';
	this.domObjects = [];

	this.lastPitch = 0;

	// artificial horizon instrument
	const globe = new Group();

	const ring = new CylinderBufferGeometry( stdWidth * 0.90, stdWidth, 3, 32, 1, true );
	ring.rotateX( Math.PI / 2 );

	const sphere = new SphereBufferGeometry( stdWidth - 10, 31, 31 );
	const bar    = new Geometry();
	const marks  = new Geometry();

	const sv = sphere.getAttribute( 'position' ).count;

	const sphereColors = new BufferAttribute( new Float32Array( sv * 3 ), 3 );

	const colours = [];
	var i;

	for ( i = 0; i < sv; i++ ) {

		colours.push( ( i < sv / 2 ) ? c1 : c2 );

	}

	sphere.addAttribute( 'color', sphereColors.copyColorsArray( colours ) );

	// view orinetation line
	bar.vertices.push( new Vector3( 4 - stdWidth, 0, stdWidth ) );
	bar.vertices.push( new Vector3( stdWidth - 4, 0, stdWidth ) );

	// pitch interval marks
	const m1 = new Vector3(  4, 0, stdWidth - 10 );
	const m2 = new Vector3( -4, 0, stdWidth - 10 );

	const xAxis = new Vector3( 1, 0, 0 );

	for ( i = 0; i < 12; i++ ) {

		let mn1 = m1.clone();
		let mn2 = m2.clone();

		if ( i % 3 === 0 ) {

			mn1.x =  7;
			mn2.x = -7;

		}

		mn1.applyAxisAngle( xAxis, i * Math.PI / 6 );
		mn2.applyAxisAngle( xAxis, i * Math.PI / 6 );

		marks.vertices.push( mn1 );
		marks.vertices.push( mn2 );

	}

	const mRing   = new Mesh( ring, new MeshPhongMaterial( { color: Cfg.themeValue( 'hud.bezel' ), specular: 0x888888 } ) );
	const mSphere = new Mesh( sphere, new MeshPhongMaterial( { vertexColors: VertexColors, specular: 0x666666, shininess: 20 } ) );
	const mBar    = new LineSegments( bar,   new LineBasicMaterial( { color: Cfg.themeValue( 'hud.ahi.bar' ) } ) );
	const mMarks  = new LineSegments( marks, new LineBasicMaterial( { color: Cfg.themeValue( 'hud.ahi.marks' ) } ) );

	mSphere.rotateOnAxis( new Vector3( 0, 1, 0 ), Math.PI / 2 );
	mMarks.rotateOnAxis( new Vector3( 1, 0, 0 ), Math.PI / 2 );
	mRing.rotateOnAxis( new Vector3( 0, 0, 1 ), Math.PI / 8 );

	globe.add( mSphere );
	globe.add( mMarks );

	this.add( mRing );
	this.add( globe );
	this.add( mBar );

	const offset = stdWidth + stdMargin;

	this.translateX( -3 * offset );
	this.translateY( offset );

	const panel = document.createElement( 'div' );

	panel.classList.add( 'cv-ahi' );
	panel.textContent = '';

	container.appendChild( panel );

	this.globe = globe;
	this.txt = panel;

	this.domObjects.push( panel );

	this.addEventListener( 'removed', this.removeDomObjects );
	this.txt.textContent = '-90\u00B0';

	return this;

}

AHI.prototype = Object.create( Group.prototype );

Object.assign( AHI.prototype, HudObject.prototype );

AHI.prototype.constructor = AHI;

AHI.prototype.set = function () {

	const xAxis   = new Vector3( 1, 0, 0 );
	const direction = new Vector3();

	return function set ( vCamera ) {

		vCamera.getWorldDirection( direction );

		var pitch = Math.PI / 2 - direction.angleTo( upAxis );

		if ( pitch === this.lastPitch ) return;

		this.globe.rotateOnAxis( xAxis, pitch - this.lastPitch );
		this.lastPitch = pitch;

		this.txt.textContent = Math.round( _Math.radToDeg( pitch ) ) + '\u00B0';

	};

} ();

export { AHI };

// EOF