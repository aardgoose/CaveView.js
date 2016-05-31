"use strict";

var CV = CV || {};

CV.DepthMapMaterial = function ( minHeight, maxHeight ) {

	THREE.ShaderMaterial.call( this, {

		uniforms: {

			minZ:   { value: minHeight },
			scaleZ: { value: 1 / ( maxHeight - minHeight ) }

		},

		vertexShader:    CV.Shaders.depthMapVertexShader,
		fragmentShader:  CV.Shaders.depthMapFragmentShader,
		depthWrite:      false,
		type:            "CV.DepthMapMaterial"

	} );

	return this;

}

CV.DepthMapMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

CV.DepthMapMaterial.prototype.constructor = CV.DepthMapMaterial;

// EOF