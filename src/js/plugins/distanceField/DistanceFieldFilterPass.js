import {
	ShaderMaterial,
	UniformsUtils
} from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { DistanceFieldFilterShader } from './DistanceFieldFilterShader';

class DistanceFieldFilterPass extends Pass {

	constructor ( width, height, /* params */ ) {

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

	render( renderer, writeBuffer, readBuffer/*, deltaTime, maskActive*/ ) {

		this.material.uniforms[ 'tDiffuse' ].value = readBuffer.texture;

		if ( this.renderToScreen ) {

			renderer.setRenderTarget( null );
			this.fsQuad.render( renderer );

		} else {

			renderer.setRenderTarget( writeBuffer );
			if ( this.clear ) renderer.clear();
			this.fsQuad.render( renderer );

		}

	}

	setSize( width, height ) {

		this.uniforms.width.value = width;
		this.uniforms.height.value = height;

	}

}

export { DistanceFieldFilterPass };