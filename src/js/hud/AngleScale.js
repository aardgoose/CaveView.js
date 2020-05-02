import { GlyphString } from '../core/GlyphString';

import {
	Vector3, RingBufferGeometry, Float32BufferAttribute,
	MeshBasicMaterial, Mesh
} from '../Three';

function AngleScale ( hudObject, caption ) {

	const stdWidth  = hudObject.stdWidth;
	const stdMargin = hudObject.stdMargin;
	const materials = hudObject.ctx.materials;

	const pNormal = new Vector3( 1, 0, 0 );

	const geometry = new RingBufferGeometry( 1, 40, 36, 1, Math.PI, Math.PI );

	const hues = materials.colourCache.getColors( 'inclination' );
	const colors = [];

	const vertices = geometry.getAttribute( 'position' );
	const vertexCount = vertices.count;
	const ringColors = new Float32BufferAttribute( vertexCount * 3, 3 );

	const v3 = new Vector3();

	var i;

	for ( i = 0; i < vertexCount; i++ ) {

		v3.fromBufferAttribute( vertices, i ).normalize();

		const hueIndex = Math.floor( 127 * 2 * Math.asin( Math.abs( v3.dot( pNormal ) ) ) / Math.PI );

		colors.push( hues[ hueIndex ] );

	}

	geometry.setAttribute( 'color', ringColors.copyColorsArray( colors ) );

	hudObject.dropBuffers( geometry );

	Mesh.call( this, geometry, new MeshBasicMaterial( { color: 0xffffff, vertexColors: true } ) );

	this.translateY( 3 * ( stdWidth + stdMargin ) + stdMargin + 30 );
	this.translateX( - 40 - 5 );

	this.name = 'CV.AngleScale';

	const material = materials.getGlyphMaterial( hudObject.atlasSpec, 0 );
	const label = new GlyphString( caption, material, hudObject.ctx );

	label.translateX( - label.getWidth() / 2 );
	label.translateY( 5 );

	this.addStatic( label );

	this.visible = false;

	return this;

}

AngleScale.prototype = Object.create( Mesh.prototype );

export { AngleScale };