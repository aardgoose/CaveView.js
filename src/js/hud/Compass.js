import { MutableGlyphString } from '../core/GlyphString';

import {
	Vector3, MathUtils,
	RingBufferGeometry,
	MeshBasicMaterial, MeshLambertMaterial,
	BufferGeometry, Float32BufferAttribute,
	Mesh, Group, Euler
} from '../Three';

const __direction = new Vector3();
const __negativeZAxis = new Vector3( 0, 0, -1 );
const __e = new Euler();

class Compass extends Group {

	constructor( hudObject ) {

		const stdWidth  = hudObject.stdWidth;
		const stdMargin = hudObject.stdMargin;
		const cfg = hudObject.ctx.cfg;
		const materials = hudObject.ctx.materials;

		super();

		this.name = 'CV.Compass';

		const cg1 = hudObject.getCommonRing();

		const c1 = new Mesh( cg1, materials.getBezelMaterial() );

		const cg2 = new RingBufferGeometry( stdWidth * 0.9, stdWidth, 4, 1, -Math.PI / 32 + Math.PI / 2, Math.PI / 16 );
		cg2.translate( 0, 0, 5 );

		const c2 = new Mesh( cg2, new MeshBasicMaterial( { color: cfg.themeValue( 'hud.compass.top1' ) } ) );

		c1.dropBuffers();
		c2.dropBuffers();

		const rMesh = _makeRose();

		const rotaryGroup = new Group();

		rotaryGroup.addStatic( c1 );
		rotaryGroup.addStatic( c2 );
		rotaryGroup.addStatic( rMesh );

		this.add( rotaryGroup );
		this.rotaryGroup = rotaryGroup;

		const offset = stdWidth + stdMargin;

		this.translateX( -offset );
		this.translateY(  offset );

		this.lastRotation = 0;

		const material = materials.getLabelMaterial( 'hud' );
		const label = new MutableGlyphString( '000\u00B0', material );

		label.translateX( - label.getWidth() / 2 );
		label.translateY( stdWidth + 5 );

		this.addStatic( label );

		this.label = label;

		return;

		function _makeRose() {

			const geometry = new BufferGeometry();
			const material = new MeshLambertMaterial( { vertexColors: true } );

			const mesh = new Mesh( geometry, material );

			const vertices = [];
			const colours = [];

			_makeRose2( cfg.themeColor( 'hud.compass.bottom1' ), cfg.themeColor( 'hud.compass.bottom2' ), Math.PI / 4 );
			_makeRose2( cfg.themeColor( 'hud.compass.top1' ), cfg.themeColor( 'hud.compass.top2' ), 0 );

			const positions = new Float32BufferAttribute( vertices.length, 3 );
			const colors = new Float32BufferAttribute( vertices.length * 3, 3 );

			geometry.setAttribute( 'position', positions.copyArray( vertices ) );
			geometry.setAttribute( 'color', colors.copyColorsArray( colours ) );

			geometry.computeVertexNormals();

			return mesh;

			function _makeRose2( color1, color2, offset ) {

				const radius = stdWidth * 0.9;
				const innerR = radius * 0.2;

				const xlv = Math.PI / 4;
				const xc = Math.PI / 2;

				for ( let i = 0; i < 4; i++ ) {

					const a = i * Math.PI / 2 + offset;

					vertices.push( Math.sin( a ) * radius, Math.cos( a ) * radius, 0 );
					vertices.push( 0, 0, 2 );
					vertices.push( Math.sin( a + xlv ) * innerR, Math.cos( a + xlv ) * innerR, 0 );

					colours.push( color1, color1, color1 );

					vertices.push( Math.sin( a + xlv ) * innerR, Math.cos( a + xlv ) * innerR, 0 );
					vertices.push( 0, 0, 2 );
					vertices.push( Math.sin( a + xc ) * radius, Math.cos( a + xc ) * radius, 0 );

					colours.push( color2, color2, color2 );

				}

			}

		}

	}

	set ( vCamera ) {

		let a;

		vCamera.getWorldDirection( __direction );

		if ( Math.abs( __direction.z ) < 0.999 ) {

			a = Math.atan2( - __direction.x, __direction.y );

		} else {

			__e.setFromQuaternion( vCamera.quaternion );
			a = __e.z;

		}

		if ( a === this.lastRotation ) return;

		if ( a < 0 ) a = Math.PI * 2 + a;

		let degrees = Math.round( MathUtils.radToDeg( a ) );

		if ( degrees === 360 ) degrees = 0;

		const res = degrees.toString().padStart( 3, '0' ) + '\u00B0'; // unicode degree symbol

		this.label.replaceString( res );
		this.rotaryGroup.rotateOnAxis( __negativeZAxis, a - this.lastRotation );
		this.lastRotation = a;

	}

}

export { Compass };