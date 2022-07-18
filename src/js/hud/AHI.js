import { LineSegments2 } from '../core/LineSegments2';
import { LineSegmentsGeometry } from '../core/LineSegmentsGeometry';
import { Line2Material } from '../materials/Line2Material';
import { MutableGlyphString } from '../core/GlyphString';

import {
	Float32BufferAttribute,
	Group,
	MathUtils,
	Mesh,
	MeshPhongMaterial,
	Object3D,
	SphereGeometry,
	Vector3
} from '../Three';

// preallocated tmp objects
const __xAxis = new Vector3( 1, 0, 0 );
const __direction = new Vector3();

class AHI extends Group {

	constructor ( hudObject ) {

		const stdWidth  = hudObject.stdWidth;
		const stdMargin = hudObject.stdMargin;

		const ctx = hudObject.ctx;
		const cfg = ctx.cfg;
		const materials = ctx.materials;

		const c1 = cfg.themeColor( 'hud.ahi.sky' );
		const c2 = cfg.themeColor( 'hud.ahi.earth' );

		super();

		this.name = 'CV.AHI';
		this.visible = false;

		this.lastPitch = 0;

		// artificial horizon instrument
		const globe = new Group();

		const ring = hudObject.getCommonRing();
		const ahiWidth = stdWidth * 0.75;

		const sphere = new SphereGeometry( ahiWidth, 31, 31 );
		const bar    = new LineSegmentsGeometry();
		const marks  = new LineSegmentsGeometry();

		const sv = sphere.getAttribute( 'position' ).count;

		const sphereColors = new Float32BufferAttribute( new Float32Array( sv * 3 ), 3 );

		for ( let i = 0; i < sv; i++ ) {

			( ( i < sv / 2 ) ? c1 : c2 ).toArray( sphereColors.array, i * 3 );

		}

		sphere.setAttribute( 'color', sphereColors );

		let vertices = [];

		// view orientation line

		vertices.push( 4 - stdWidth, 0, ahiWidth );
		vertices.push( stdWidth - 4, 0, ahiWidth );

		bar.setPositions( vertices );

		const markWidth = stdWidth / 10;

		// pitch interval marks
		const m1 = new Vector3(  markWidth, 0, ahiWidth + 1 );
		const m2 = new Vector3( -markWidth, 0, ahiWidth + 1 );

		vertices = [];

		for ( let i = 0; i < 12; i++ ) {

			const mn1 = m1.clone();
			const mn2 = m2.clone();

			if ( i % 3 === 0 ) {

				mn1.x *= 2;
				mn2.x *= 2;

			}

			mn1.applyAxisAngle( __xAxis, i * Math.PI / 6 );
			mn2.applyAxisAngle( __xAxis, i * Math.PI / 6 );

			vertices.push( mn1.x, mn1.y, mn1.z, mn2.x, mn2.y, mn2.z );

		}

		marks.setPositions( vertices );

		const mRing   = new Mesh( ring, materials.getBezelMaterial() );
		const mSphere = new Mesh( sphere, new MeshPhongMaterial( { vertexColors: true, specular: 0x666666, shininess: 20 } ) );
		const mBar    = new LineSegments2( bar,   new Line2Material( ctx, { color: cfg.themeValue( 'hud.ahi.bar' ) } ) );
		const mMarks  = new LineSegments2( marks, new Line2Material( ctx, { color: cfg.themeValue( 'hud.ahi.marks' ) } ) );

		mSphere.rotateOnAxis( new Vector3( 0, 1, 0 ), Math.PI / 2 );
		mMarks.rotateOnAxis( new Vector3( 1, 0, 0 ), Math.PI / 2 );
		mRing.rotateOnAxis( new Vector3( 0, 0, 1 ), Math.PI / 8 );

		mSphere.dropBuffers();

		globe.addStatic( mSphere );
		globe.addStatic( mMarks );

		this.addStatic( mRing );
		this.addStatic( mBar );

		this.add( globe );

		const offset = stdWidth + stdMargin;

		this.translateX( -3 * offset );
		this.translateY( offset );

		this.globe = globe;

		const material = materials.getLabelMaterial( 'hud' );
		const label = new MutableGlyphString( '-90\u00B0', material );

		label.translateX( - label.getWidth() / 2 );
		label.translateY( stdWidth + 5 );

		this.addStatic( label );

		this.label = label;

		return this;

	}

	set ( vCamera ) {

		vCamera.getWorldDirection( __direction );

		const pitch = Math.PI / 2 - __direction.angleTo( Object3D.DefaultUp );

		if ( pitch === this.lastPitch ) return;

		this.globe.rotateOnAxis( __xAxis, pitch - this.lastPitch );
		this.lastPitch = pitch;
		this.label.replaceString( String( Math.round( MathUtils.radToDeg( pitch ) ) + '\u00B0' ).padStart( 4, ' ' ) );

	}

}

export { AHI };