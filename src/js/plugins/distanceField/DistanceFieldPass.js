import { ShaderMaterial, cloneUniforms } from '../Three';
import { FullScreenQuad } from './FullScreenQuad';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { DistanceFieldShader } from './DistanceFieldShader';

class DistanceFieldPass {

	constructor ( width, height, pixelIncrement ) {

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
		this.pixelIncrement = pixelIncrement;

	}

	render ( renderer, writeBuffer, readBuffer, params ) {

		this.material.uniforms[ 'tSource' ].value = readBuffer.texture;
		this.material.uniforms.beta.value = params.beta / this.pixelIncrement;
		this.material.uniforms.offset.value = params.offset;
		this.material.needsUpdate = true;

		this.copyMaterial.uniforms[ 'tDiffuse' ].value = readBuffer.texture;
		this.copyMaterial.needsUpdate = true;

		renderer.setRenderTarget( writeBuffer );
		renderer.clear();

		this.fsQuadCopy.render( renderer );

		this.fsQuad.render( renderer );

		renderer.getContext().finish();

	}

	dispose () {

		this.fsQuad.dispose();
		this.fsQuadCopy.dispose();

	}

}

export { DistanceFieldPass };