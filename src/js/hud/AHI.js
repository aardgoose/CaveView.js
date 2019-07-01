
import { HudObject } from './HudObject';
import { Cfg } from '../core/lib';
import { MutableGlyphString } from '../core/GlyphString';
import { Materials } from '../materials/Materials';

import {
	Vector3, Math as _Math,
	BufferGeometry, SphereBufferGeometry,
	LineBasicMaterial, MeshPhongMaterial,
	Float32BufferAttribute,
	VertexColors,
	Object3D, Mesh, LineSegments, Group
} from '../Three';

// preallocated tmp objects

const __xAxis = new Vector3( 1, 0, 0 );
const __direction = new Vector3();


function AHI () {

	const stdWidth  = HudObject.stdWidth;
	const stdMargin = HudObject.stdMargin;

	const c1 = Cfg.themeColor( 'hud.ahi.sky' );
	const c2 = Cfg.themeColor( 'hud.ahi.earth' );

	Group.call( this );

	this.name = 'CV.AHI';

	this.lastPitch = 0;

	// artificial horizon instrument
	const globe = new Group();

	const ring = HudObject.getCommonRing();

	const sphere = new SphereBufferGeometry( stdWidth - 10, 31, 31 );
	const bar    = new BufferGeometry();
	const marks  = new BufferGeometry();

	const sv = sphere.getAttribute( 'position' ).count;

	HudObject.dropBuffers( sphere );

	const sphereColors = new Float32BufferAttribute( new Float32Array( sv * 3 ), 3 );

	const colours = [];
	var i;

	for ( i = 0; i < sv; i++ ) {

		colours.push( ( i < sv / 2 ) ? c1 : c2 );

	}

	sphere.addAttribute( 'color', sphereColors.copyColorsArray( colours ) );

	var vertices = [];

	// view orientation line
	vertices.push( 4 - stdWidth, 0, stdWidth );
	vertices.push( stdWidth - 4, 0, stdWidth );

	const positions = new Float32BufferAttribute( vertices.length, 3 );

	bar.addAttribute( 'position', positions.copyArray( vertices ) );

	// pitch interval marks
	const m1 = new Vector3(  4, 0, stdWidth - 10 );
	const m2 = new Vector3( -4, 0, stdWidth - 10 );

	vertices = [];

	for ( i = 0; i < 12; i++ ) {

		let mn1 = m1.clone();
		let mn2 = m2.clone();

		if ( i % 3 === 0 ) {

			mn1.x =  7;
			mn2.x = -7;

		}

		mn1.applyAxisAngle( __xAxis, i * Math.PI / 6 );
		mn2.applyAxisAngle( __xAxis, i * Math.PI / 6 );

		vertices.push( mn1 );
		vertices.push( mn2 );

	}

	const markPositions = new Float32BufferAttribute( vertices.length * 3, 3 );

	marks.addAttribute( 'position', markPositions.copyVector3sArray( vertices ) );

	const mRing   = new Mesh( ring, new MeshPhongMaterial( { color: Cfg.themeValue( 'hud.bezel' ), specular: 0x888888 } ) );
	const mSphere = new Mesh( sphere, new MeshPhongMaterial( { vertexColors: VertexColors, specular: 0x666666, shininess: 20 } ) );
	const mBar    = new LineSegments( bar,   new LineBasicMaterial( { color: Cfg.themeValue( 'hud.ahi.bar' ) } ) );
	const mMarks  = new LineSegments( marks, new LineBasicMaterial( { color: Cfg.themeValue( 'hud.ahi.marks' ) } ) );

	mSphere.rotateOnAxis( new Vector3( 0, 1, 0 ), Math.PI / 2 );
	mMarks.rotateOnAxis( new Vector3( 1, 0, 0 ), Math.PI / 2 );
	mRing.rotateOnAxis( new Vector3( 0, 0, 1 ), Math.PI / 8 );

	globe.addStatic( mSphere );
	globe.addStatic( mMarks );

	this.addStatic( mRing );
	this.addStatic( mBar );

	this.add( globe );

	const offset = stdWidth + stdMargin;

	this.translateX( -3 * offset );
	this.translateY( offset );

	this.globe = globe;

	const material = Materials.getGlyphMaterial( HudObject.atlasSpec, 0 );
	const label = new MutableGlyphString( '-90\u00B0', material );

	label.translateX( - label.getWidth() / 2 );
	label.translateY( stdWidth + 5 );

	this.addStatic( label );

	this.label = label;

	return this;

}

AHI.prototype = Object.create( Group.prototype );

AHI.prototype.set = function ( vCamera ) {

	vCamera.getWorldDirection( __direction );

	const pitch = Math.PI / 2 - __direction.angleTo( Object3D.DefaultUp );

	if ( pitch === this.lastPitch ) return;

	this.globe.rotateOnAxis( __xAxis, pitch - this.lastPitch );
	this.lastPitch = pitch;

	this.label.replaceString( String( Math.round( _Math.radToDeg( pitch ) ) + '\u00B0' ).padStart( 4, ' ' ) );

};

export { AHI };

// EOF