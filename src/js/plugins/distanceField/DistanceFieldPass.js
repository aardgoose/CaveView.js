import { ShaderMaterial, cloneUniforms } from '../../Three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';
import { DistanceFieldShader } from './DistanceFieldShader';

class DistanceFieldPass {

	constructor ( width, height ) {

		// distance field iteration shader

		this.uniforms = cloneUniforms( DistanceFieldShader.uniforms );
		this.material = new ShaderMaterial( {
			uniforms: this.uniforms,
			fragmentShader: DistanceFieldShader.fragmentShader,
			vertexShader: DistanceFieldShader.vertexShader,
			depthTest: false,
			depthWrite: false
		} );

		this.uniforms.width.value = width;
		this.uniforms.height.value = height;
		this.fsQuad = new FullScreenQuad( this.material );

		// copy shader

		this.copyUniforms = cloneUniforms( CopyShader.uniforms );
		this.copyMaterial = new ShaderMaterial(  {
			uniforms: this.copyUniforms,
			vertexShader: CopyShader.vertexShader,
			fragmentShader: CopyShader.fragmentShader,
			depthTest: false,
			depthWrite: false
		} );

		this.fsQuadCopy = new FullScreenQuad( this.copyMaterial );

	}

	render( renderer, writeBuffer, readBuffer, params ) {

		this.material.uniforms[ 'tSource' ].value = readBuffer.texture;
		this.material.uniforms.beta.value = params.beta / (  256 * 128   );
		this.material.uniforms.offset.value = params.offset;
		this.material.needsUpdate = true;

		this.copyMaterial.uniforms[ 'tDiffuse' ].value = readBuffer.texture;
		this.copyMaterial.needsUpdate = true;

		const gl = renderer.getContext();
		const query = gl.createQuery();

		renderer.setRenderTarget( writeBuffer );
		renderer.clear();

		this.fsQuadCopy.render( renderer );

		gl.beginQuery( gl.ANY_SAMPLES_PASSED, query );
		this.fsQuad.render( renderer );

		gl.endQuery( gl.ANY_SAMPLES_PASSED );
		gl.finish();

		const resA = gl.getQueryParameter( query, gl.QUERY_RESULT_AVAILABLE );
		const res = gl.getQueryParameter( query, gl.QUERY_RESULT );

		console.log( 'q', resA, res );

		setTimeout( () => {

			const resA = gl.getQueryParameter( query, gl.QUERY_RESULT_AVAILABLE );
			const res = gl.getQueryParameter( query, gl.QUERY_RESULT );

			console.log( 'q2', resA, res );

		}, 100 );

	}

}

export { DistanceFieldPass };