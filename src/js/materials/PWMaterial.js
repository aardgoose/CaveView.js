"use strict";

var CV = CV || {};

CV.PWMaterial = function () {

	THREE.ShaderMaterial.call( this, {

		uniforms: {
    		zoom:   new THREE.Uniform( 1.0 ).onUpdate( _updateZoomUniform ),
			offset: { value: new THREE.Vector2(1.150, 0.275) },
  			cmap:   { value: CV.Colours.gradientTexture },
			uLight: { value: new THREE.Vector3( -1, -1, 2 ) }
   		 },

		vertexShader: CV.Shaders.pwVertexShader,
		fragmentShader: CV.Shaders.pwFragmentShader

	} );

	this.type = "PWMaterial";

	return this;

	function _updateZoomUniform() {

		this.value += 0.008;

	}

}

CV.PWMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

CV.PWMaterial.prototype.constructor = CV.PWMaterial;

// EOF