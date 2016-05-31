"use strict";

CV.TestMaterial = function ( spread ) {

	var i = 1;

	THREE.ShaderMaterial.call( this, {

		uniforms: {

			spread: { value: spread },
			rIn: new THREE.Uniform( 1.0 ).onUpdate( _updateZoomUniform ),

		},

		vertexShader:   CV.Shaders.testVertexShader,	
		fragmentShader: CV.Shaders.testFragmentShader,
		vertexColors:   THREE.VertexColors
	} );

	this.type = "CV.TestMaterial";

	return this;

	function _updateZoomUniform() {

		if ( ++i % 5 ) return;
		this.value = Math.random();

	}

}

CV.TestMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

CV.TestMaterial.prototype.constructor = CV.TestMaterial;

// EOF