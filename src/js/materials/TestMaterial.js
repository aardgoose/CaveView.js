

function TestMaterial ( spread ) {

	var i = 1;

	THREE.ShaderMaterial.call( this, {

		uniforms: {

			spread: { value: spread },
			rIn: new THREE.Uniform( 1.0 ).onUpdate( _updateZoomUniform ),

		},

		vertexShader:   Shaders.testVertexShader,	
		fragmentShader: Shaders.testFragmentShader,
		vertexColors:   THREE.VertexColors
	} );

	this.type = "CV.TestMaterial";

	return this;

	function _updateZoomUniform() {

		if ( ++i % 5 ) return;
		this.value = Math.random();

	}

}

TestMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

TestMaterial.prototype.constructor = TestMaterial;

export { TestMaterial };

// EOF