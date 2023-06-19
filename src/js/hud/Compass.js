import {
	BufferGeometry,
	Euler,
	Float32BufferAttribute,
	Group,
	MathUtils,
	Mesh,
	RingGeometry,
	Vector3
} from '../Three';
import { MeshPhongNodeMaterial, MeshBasicNodeMaterial } from '../Nodes';
import { GlyphMaterial } from '../nodeMaterials/GlyphMaterial';
import { MutableGlyphString } from '../core/GlyphString';

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
		this.visible = false;

		const cg1 = hudObject.getCommonRing();

		const c1 = new Mesh( cg1, hudObject.getBezelMaterial() );

		const cg2 = new RingGeometry( stdWidth * 0.9, stdWidth, 4, 1, -Math.PI / 32 + Math.PI / 2, Math.PI / 16 );
		cg2.translate( 0, 0, 5 );

		const c2 = new Mesh( cg2, new MeshBasicNodeMaterial( { color: cfg.themeValue( 'hud.compass.top1' ) } ) );

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

		const material = materials.getMaterial( GlyphMaterial, 'hud.text' );
		const label = new MutableGlyphString( '000\u00B0', material );

		label.translateX( - label.getWidth() / 2 );
		label.translateY( stdWidth + 5 );

		this.addStatic( label );

		this.label = label;

		return;

		function _makeRose() {

			const geometry = new BufferGeometry();

			const mesh = new Mesh( geometry, new MeshPhongNodeMaterial( { vertexColors: true } ) );

			const positions = new Float32BufferAttribute( 144, 3 );
			const colors = new Float32BufferAttribute( 144, 3 );

			let vertex = 0;

			_makeRose2( cfg.themeColor( 'hud.compass.bottom1' ), cfg.themeColor( 'hud.compass.bottom2' ), Math.PI / 4 );
			_makeRose2( cfg.themeColor( 'hud.compass.top1' ), cfg.themeColor( 'hud.compass.top2' ), 0 );

			geometry.setAttribute( 'position', positions );
			geometry.setAttribute( 'color', colors );

			geometry.computeVertexNormals();

			return mesh;

			function _makeRose2( color1, color2, offset ) {

				const radius = stdWidth * 0.9;
				const innerR = radius * 0.2;

				const xlv = Math.PI / 4;
				const xc = Math.PI / 2;

				for ( let i = 0; i < 4; i++ ) {

					const a = i * Math.PI / 2 + offset;

					positions.setXYZ( vertex, Math.sin( a ) * radius, Math.cos( a ) * radius, 0 );
					colors.setXYZ( vertex++, color1.r, color1.g, color1.b );

					positions.setXYZ( vertex, 0, 0, 2 );
					colors.setXYZ( vertex++, color1.r, color1.g, color1.b );

					positions.setXYZ( vertex, Math.sin( a + xlv ) * innerR, Math.cos( a + xlv ) * innerR, 0 );
					colors.setXYZ( vertex++, color1.r, color1.g, color1.b );


					positions.setXYZ( vertex, Math.sin( a + xlv ) * innerR, Math.cos( a + xlv ) * innerR, 0 );
					colors.setXYZ( vertex++, color2.r, color2.g, color2.b );

					positions.setXYZ( vertex, 0, 0, 2 );
					colors.setXYZ( vertex++, color2.r, color2.g, color2.b );

					positions.setXYZ( vertex, Math.sin( a + xc ) * radius, Math.cos( a + xc ) * radius, 0 );
					colors.setXYZ( vertex++, color2.r, color2.g, color2.b );

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