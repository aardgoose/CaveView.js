"use strict";

var CV = CV || {};

CV.HeightMaterial = function ( type, minHeight, maxHeight ) {

	THREE.ShaderMaterial.call( this );

	this.defines = {};

	if ( type === CV.MATERIAL_LINE ) {

		this.defines.USE_COLOR = true;

	} else {

		this.defines.SURFACE = true;

	}
	
	this.uniforms = {

			// pseudo light source somewhere over viewer's left shoulder.
			uLight: { value: new THREE.Vector3( -1, -1, 2 ) },

			minZ:   { value: minHeight },
			scaleZ: { value: 1 / ( maxHeight - minHeight ) },
			cmap:   { value: CV.Colours.gradientTexture }

		};

	this.vertexShader   = CV.Shaders.heightVertexShader;
	this.fragmentShader = CV.Shaders.heightFragmentShader;

	this.type = "CV.HeightMaterial";

	return this;

}

CV.HeightMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

CV.HeightMaterial.prototype.constructor = CV.HeightMaterial;

// EOF