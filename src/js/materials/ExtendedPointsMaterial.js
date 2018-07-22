
import { PointsMaterial, TextureLoader, VertexColors } from '../Three';
import { Cfg } from '../core/lib';
import { ColourCache } from '../core/ColourCache';

function ExtendedPointsMaterial () {

	PointsMaterial.call( this );

	this.map = new TextureLoader().load( Cfg.value( 'home', '' ) + 'images/disc.png' );
	this.color = ColourCache.white;
	this.opacity = 1.0;
	this.alphaTest = 0.8;

	this.size = 1;
	this.scale = 1;
	this.sizeAttenuation = true;
	this.transparent = true;
	this.vertexColors = VertexColors;

	this.onBeforeCompile = function ( shader ) {

		var vertexShader = shader.vertexShader
			.replace( '#include <common>', '\nattribute float pSize;\n\n$&' )
			.replace( '\t\tgl_PointSize = size;', '\t\tgl_PointSize = pSize;' )
			.replace( '\t\tgl_PointSize = size * ( scale / - mvPosition.z );', '\t\tgl_PointSize = pSize * ( scale / - mvPosition.z );' );

		shader.vertexShader = vertexShader;

	};

	return this;

}

ExtendedPointsMaterial.prototype = Object.create( PointsMaterial.prototype );

export { ExtendedPointsMaterial };

// EOF