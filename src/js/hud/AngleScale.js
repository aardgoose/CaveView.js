
import { HudObject } from './HudObject';
import { ColourCache } from '../core/ColourCache';
import { GlyphString } from '../core/GlyphString';
import { Materials } from '../materials/Materials';

import {
	Vector3,
	RingGeometry,
	MeshBasicMaterial,
	VertexColors, FrontSide,
	Mesh
} from '../Three';

function AngleScale ( container, caption ) {

	const width  = container.clientWidth;
	const height = container.clientHeight;

	const stdWidth  = HudObject.stdWidth;
	const stdMargin = HudObject.stdMargin;

	const pNormal = new Vector3( 1, 0, 0 );

	const geometry = new RingGeometry( 1, 40, 36, 1, Math.PI, Math.PI );
	const vertices = geometry.vertices;

	const hues = ColourCache.getColors( 'inclination' );
	const c = [];

	const legNormal = new Vector3();

	var i, l, f;

	for ( i = 0, l = vertices.length; i < l; i++ ) {

		legNormal.copy( vertices[ i ] ).normalize();

		const dotProduct = legNormal.dot( pNormal );
		const hueIndex = Math.floor( 127 * 2 * Math.asin( Math.abs( dotProduct ) ) / Math.PI );

		c[ i ] = hues[ hueIndex ];

	}

	const faces = geometry.faces;

	for ( i = 0, l = faces.length; i < l; i++ ) {

		f = faces[ i ];

		f.vertexColors = [ c[ f.a ], c[ f.b ], c[ f.c ] ];

	}

	geometry.colorsNeedUpdate = true;

	Mesh.call( this, geometry, new MeshBasicMaterial( { color: 0xffffff, vertexColors: VertexColors, side: FrontSide } ) );

	this.translateY( -height / 2 + 3 * ( stdWidth + stdMargin ) + stdMargin + 30 );
	this.translateX(  width / 2 - 40 - 5 );

	this.name = 'CV.AngleScale';

	const material = Materials.getGlyphMaterial( HudObject.atlasSpec, 0 );
	const label = new GlyphString( caption, material );

	label.translateX( - label.getWidth() / 2 );
	label.translateY( 5 );

	this.add( label );

	return this;

}

AngleScale.prototype = Object.create( Mesh.prototype );

export { AngleScale };

// EOF