import { ShaderMaterial } from '../Three';
import { Shaders } from './shaders/Shaders';

class WallMaterial extends ShaderMaterial {

	constructor ( ctx, options ) {

		const survey = ctx.survey;
		const uniforms = ctx.materials.uniforms;

		super( {
			vertexShader: Shaders.wallVertexShader,
			fragmentShader: Shaders.wallFragmentShader,
			type: 'CV.WallMaterial',
			uniforms: Object.assign( {
				// pseudo light source somewhere over viewer's left shoulder.
				uLight:     { value: survey.lightDirection },
			}, uniforms.common, uniforms.commonDepth ),
			defines: {
				USE_COLOR: true,
				CV_LOCATION: options.location
			}
		} );

		this.transparent = options.location;
		this.color = ctx.cfg.themeColor( 'shading.single' );

		ctx.cfg.themeColor( 'shading.single' ).toArray( this.defaultAttributeValues.color, 0 );

	}

}

export { WallMaterial };