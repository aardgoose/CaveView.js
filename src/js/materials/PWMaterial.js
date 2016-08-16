

function PWMaterial () {

	THREE.ShaderMaterial.call( this, {

		uniforms: {
    		zoom:   new THREE.Uniform( 1.0 ).onUpdate( _updateZoomUniform ),
			offset: { value: new THREE.Vector2(1.150, 0.275) },
  			cmap:   { value: Colours.gradientTexture },
			uLight: { value: new THREE.Vector3( -1, -1, 2 ) }
   		 },

		vertexShader: Shaders.pwVertexShader,
		fragmentShader: Shaders.pwFragmentShader

	} );

	this.type = "PWMaterial";

	return this;

	function _updateZoomUniform() {

		this.value += 0.008;

	}

}

PWMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

PWMaterial.prototype.constructor = PWMaterial;

export { PWMaterial };

// EOF