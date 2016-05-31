"use strict";

var CV = CV || {};

CV.DepthMaterial = function ( type, limits, texture ) {

	var range   = limits.size();
	var defines = {};

	if ( type === CV.MATERIAL_LINE ) {

		defines.USE_COLOR = true;

	} else {

		defines.SURFACE = true;

	}

	THREE.ShaderMaterial.call( this, {

		uniforms: {
			// pseudo light source somewhere over viewer's left shoulder.
			uLight: { value: new THREE.Vector3( -1, -1, 2 ) },

			minX:     { value: limits.min.x },
			minY:     { value: limits.min.y },
			minZ:     { value: limits.min.z },
			scaleX:   { value: 1 / range.x },
			scaleY:   { value: 1 / range.y },
			scaleZ:   { value: 1 / range.z },
			cmap:     { value: CV.Colours.gradientTexture },
			depthMap: { value: texture }

		},

		defines: defines,
		vertexShader: CV.Shaders.depthVertexShader,
		fragmentShader: CV.Shaders.depthFragmentShader
	} );

	this.type = "CV.DepthMaterial";

	return this;

}

CV.DepthMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

CV.DepthMaterial.prototype.constructor = CV.DepthMaterial;

// EOF