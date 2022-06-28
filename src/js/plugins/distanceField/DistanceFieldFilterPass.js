import { ShaderMaterial, UniformsUtils } from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { DistanceFieldFilterShader } from './DistanceFieldFilterShader';

class DistanceFieldFilterPass extends Pass {

	constructor ( width, height ) {

		super();

		this.uniforms = UniformsUtils.clone( DistanceFieldFilterShader.uniforms );
		this.material = new ShaderMaterial( {
			uniforms: this.uniforms,
			fragmentShader: DistanceFieldFilterShader.fragmentShader,
			vertexShader: DistanceFieldFilterShader.vertexShader
		} );

		// set params
		this.uniforms.width.value = width;
		this.uniforms.height.value = height;

		this.fsQuad = new FullScreenQuad( this.material );

	}

	render( renderer, writeBuffer, readBuffer  ) {

		this.material.uniforms[ 'tDiffuse' ].value = readBuffer.texture;


		renderer.setRenderTarget( writeBuffer );
		renderer.clear();
		this.fsQuad.render( renderer );
		renderer.getContext().finish();
	}

}

export { DistanceFieldFilterPass };