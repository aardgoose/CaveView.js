
import { VertexColors, Uniform, ShaderMaterial } from '../../../../three.js/src/Three.js';

function TestMaterial ( spread ) {

	var i = 1;

	ShaderMaterial.call( this, {

		uniforms: {

			spread: { value: spread },
			rIn: new Uniform( 1.0 ).onUpdate( _updateZoomUniform ),

		},

		vertexShader:   Shaders.testVertexShader,	
		fragmentShader: Shaders.testFragmentShader,
		vertexColors:   VertexColors
	} );

	this.type = "CV.TestMaterial";

	return this;

	function _updateZoomUniform() {

		if ( ++i % 5 ) return;
		this.value = Math.random();

	}

}

TestMaterial.prototype = Object.create( ShaderMaterial.prototype );

TestMaterial.prototype.constructor = TestMaterial;

export { TestMaterial };

// EOF