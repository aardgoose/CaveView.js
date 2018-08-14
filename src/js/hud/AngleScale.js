
import { HudObject } from './HudObject';
import { ColourCache } from '../core/ColourCache';
import { GlyphString } from '../core/GlyphString';
import { Materials } from '../materials/Materials';

import {
	Vector3,
	RingBufferGeometry, BufferAttribute,
	MeshBasicMaterial,
	VertexColors,
	Mesh
} from '../Three';

function AngleScale ( container, caption ) {

	const width  = container.clientWidth;
	const height = container.clientHeight;

	const stdWidth  = HudObject.stdWidth;
	const stdMargin = HudObject.stdMargin;

	const pNormal = new Vector3( 1, 0, 0 );

	const geometry = new RingBufferGeometry( 1, 40, 36, 1, Math.PI, Math.PI );

	const hues = ColourCache.getColors( 'inclination' );
	const colors = [];

	const vertices = geometry.getAttribute( 'position' );
	const vertexCount = vertices.count;
	const ringColors = new BufferAttribute( new Float32Array( vertexCount * 3 ), 3 );

	const v3 = new Vector3();

	var i;

	for ( i = 0; i < vertexCount; i++ ) {

		v3.fromBufferAttribute( vertices, i ).normalize();

		const hueIndex = Math.floor( 127 * 2 * Math.asin( Math.abs( v3.dot( pNormal ) ) ) / Math.PI );

		colors.push( hues[ hueIndex ] );

	}

	geometry.addAttribute( 'color', ringColors.copyColorsArray( colors ) );

	HudObject.dropBuffers( geometry );

	Mesh.call( this, geometry, new MeshBasicMaterial( { color: 0xffffff, vertexColors: VertexColors } ) );

	this.translateY( -height / 2 + 3 * ( stdWidth + stdMargin ) + stdMargin + 30 );
	this.translateX(  width / 2 - 40 - 5 );

	this.name = 'CV.AngleScale';

	const material = Materials.getGlyphMaterial( HudObject.atlasSpec, 0 );
	const label = new GlyphString( caption, material );

	label.translateX( - label.getWidth() / 2 );
	label.translateY( 5 );

	this.addStatic( label );

	return this;

}

AngleScale.prototype = Object.create( Mesh.prototype );

export { AngleScale };

// EOF