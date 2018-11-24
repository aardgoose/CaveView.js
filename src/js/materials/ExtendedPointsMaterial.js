
import { PointsMaterial, TextureLoader, VertexColors } from '../Three';
import { Cfg } from '../core/lib';
import { ColourCache } from '../core/ColourCache';

function ExtendedPointsMaterial () {

	PointsMaterial.call( this );

	this.map = new TextureLoader().load( Cfg.value( 'home', '' ) + 'images/disc.png' );
	this.color = ColourCache.white;
	this.opacity = 1.0;
	this.alphaTest = 0.8;

	this.sizeAttenuation = false;
	this.transparent = true; // to ensure points rendered over lines.
	this.vertexColors = VertexColors;

	this.onBeforeCompile = function ( shader ) {

		var vertexShader = shader.vertexShader
			.replace( '#include <common>', '\nattribute float pSize;\n\n$&' )
			.replace( '\tgl_PointSize = size;', '\tgl_PointSize = pSize;' );

		shader.vertexShader = vertexShader;

	};

	return this;

}

ExtendedPointsMaterial.prototype = Object.create( PointsMaterial.prototype );

export { ExtendedPointsMaterial };

// EOF