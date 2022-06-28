import { ShaderMaterial, cloneUniforms } from '../../Three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { DistanceFieldFilterShader } from './DistanceFieldFilterShader';

class DistanceFieldFilterPass  {

	constructor ( width, height ) {

		this.uniforms = cloneUniforms( DistanceFieldFilterShader.uniforms );
		this.material = new ShaderMaterial( {
			uniforms: this.uniforms,
			fragmentShader: DistanceFieldFilterShader.fragmentShader,
			vertexShader: DistanceFieldFilterShader.vertexShader
		} );

		this.uniforms.width.value = width;
		this.uniforms.height.value = height;

		this.fsQuad = new FullScreenQuad( this.material );

	}

	render ( renderer, writeBuffer, readBuffer  ) {

		this.material.uniforms[ 'tDiffuse' ].value = readBuffer.texture;

		renderer.setRenderTarget( writeBuffer );
		renderer.clear();
		this.fsQuad.render( renderer );

	}

}

export { DistanceFieldFilterPass };