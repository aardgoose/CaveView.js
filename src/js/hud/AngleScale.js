import { Float32BufferAttribute, Mesh, MeshBasicMaterial, RingBufferGeometry, Vector3 } from '../Three';
import { GlyphString } from '../core/GlyphString';

class AngleScale extends Mesh {

	constructor ( hudObject, caption ) {

		const stdWidth  = hudObject.stdWidth;
		const stdMargin = hudObject.stdMargin;
		const materials = hudObject.ctx.materials;

		const pNormal = new Vector3( 1, 0, 0 );

		const geometry = new RingBufferGeometry( 1, 40, 36, 1, Math.PI, Math.PI );

		const hues = materials.colourCache.getColorSet( 'inclination' );
		const colors = [];

		const vertices = geometry.getAttribute( 'position' );
		const vertexCount = vertices.count;
		const ringColors = new Float32BufferAttribute( vertexCount * 3, 3 );

		const v3 = new Vector3();

		for ( let i = 0; i < vertexCount; i++ ) {

			v3.fromBufferAttribute( vertices, i ).normalize();

			const hueIndex = Math.floor( 127 * 2 * Math.asin( Math.abs( v3.dot( pNormal ) ) ) / Math.PI );

			colors.push( hues[ hueIndex ] );

		}

		geometry.setAttribute( 'color', ringColors.copyColorsArray( colors ) );

		super( geometry, new MeshBasicMaterial( { color: 0xffffff, vertexColors: true } ) );

		this.translateY( 3 * ( stdWidth + stdMargin ) + stdMargin + 30 );
		this.translateX( - 40 - 5 );

		this.dropBuffers();

		this.name = 'CV.AngleScale';

		const material = materials.getLabelMaterial( 'hud' );
		const label = new GlyphString( caption, material, hudObject.ctx );

		label.translateX( - label.getWidth() / 2 );
		label.translateY( 5 );

		this.addStatic( label );

		this.visible = false;

	}

}

export { AngleScale };