import { MutableGlyphString } from '../core/GlyphString';

import {
	Vector3, MathUtils,
	BufferGeometry, SphereBufferGeometry,
	LineBasicMaterial, MeshPhongMaterial,
	Float32BufferAttribute,
	VertexColors,
	Object3D, Mesh, LineSegments, Group
} from '../Three';

// preallocated tmp objects
const __xAxis = new Vector3( 1, 0, 0 );

function AHI ( hudObject ) {

	const stdWidth  = hudObject.stdWidth;
	const stdMargin = hudObject.stdMargin;

	const cfg = hudObject.ctx.cfg;
	const materials = hudObject.ctx.materials;

	const c1 = cfg.themeColor( 'hud.ahi.sky' );
	const c2 = cfg.themeColor( 'hud.ahi.earth' );

	Group.call( this );

	this.name = 'CV.AHI';

	this.lastPitch = 0;

	// artificial horizon instrument
	const globe = new Group();

	const ring = hudObject.getCommonRing();
	const ahiWidth = stdWidth * 0.75;

	const sphere = new SphereBufferGeometry( ahiWidth, 31, 31 );
	const bar    = new BufferGeometry();
	const marks  = new BufferGeometry();

	const sv = sphere.getAttribute( 'position' ).count;

	hudObject.dropBuffers( sphere );

	const sphereColors = new Float32BufferAttribute( new Float32Array( sv * 3 ), 3 );

	const colours = [];
	var i;

	for ( i = 0; i < sv; i++ ) {

		colours.push( ( i < sv / 2 ) ? c1 : c2 );

	}

	sphere.setAttribute( 'color', sphereColors.copyColorsArray( colours ) );

	var vertices = [];

	// view orientation line

	vertices.push( 4 - stdWidth, 0, ahiWidth );
	vertices.push( stdWidth - 4, 0, ahiWidth );

	const positions = new Float32BufferAttribute( vertices.length, 3 );

	bar.setAttribute( 'position', positions.copyArray( vertices ) );

	const markWidth = stdWidth / 10;

	// pitch interval marks
	const m1 = new Vector3(  markWidth, 0, ahiWidth + 1 );
	const m2 = new Vector3( -markWidth, 0, ahiWidth + 1 );

	vertices = [];

	for ( i = 0; i < 12; i++ ) {

		let mn1 = m1.clone();
		let mn2 = m2.clone();

		if ( i % 3 === 0 ) {

			mn1.x *= 2;
			mn2.x *= 2;

		}

		mn1.applyAxisAngle( __xAxis, i * Math.PI / 6 );
		mn2.applyAxisAngle( __xAxis, i * Math.PI / 6 );

		vertices.push( mn1 );
		vertices.push( mn2 );

	}

	const markPositions = new Float32BufferAttribute( vertices.length * 3, 3 );

	marks.setAttribute( 'position', markPositions.copyVector3sArray( vertices ) );

	const mRing   = new Mesh( ring, materials.getBezelMaterial() );
	const mSphere = new Mesh( sphere, new MeshPhongMaterial( { vertexColors: VertexColors, specular: 0x666666, shininess: 20 } ) );
	const mBar    = new LineSegments( bar,   new LineBasicMaterial( { color: cfg.themeValue( 'hud.ahi.bar' ) } ) );
	const mMarks  = new LineSegments( marks, new LineBasicMaterial( { color: cfg.themeValue( 'hud.ahi.marks' ) } ) );

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

	const material = materials.getGlyphMaterial( hudObject.atlasSpec, 0 );
	const label = new MutableGlyphString( '-90\u00B0', material );

	label.translateX( - label.getWidth() / 2 );
	label.translateY( stdWidth + 5 );

	this.addStatic( label );

	this.label = label;

	return this;

}

AHI.prototype = Object.create( Group.prototype );

AHI.prototype.set = function () {

	const __direction = new Vector3();

	return function set ( vCamera ) {

		vCamera.getWorldDirection( __direction );

		const pitch = Math.PI / 2 - __direction.angleTo( Object3D.DefaultUp );

		if ( pitch === this.lastPitch ) return;

		this.globe.rotateOnAxis( __xAxis, pitch - this.lastPitch );
		this.lastPitch = pitch;

		this.label.replaceString( String( Math.round( MathUtils.radToDeg( pitch ) ) + '\u00B0' ).padStart( 4, ' ' ) );

	};

}();

export { AHI };