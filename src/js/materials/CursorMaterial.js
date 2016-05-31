"use strict";

var CV = CV || {};

CV.CursorMaterial = function ( type, initialHeight ) {

	THREE.ShaderMaterial.call( this );

	this.defines = {};

	if ( type === CV.MATERIAL_LINE ) {

		this.defines.USE_COLOR = true;

	} else {

		this.defines.SURFACE = true;

	}

	this.uniforms = {
			uLight:      { value: new THREE.Vector3( -1, -1, 2 ) },
			cursor:      { value: initialHeight },
			cursorWidth: { value: 5.0 },
			baseColor:   { value: new THREE.Color( 0x888888 ) },
			cursorColor: { value: new THREE.Color( 0x00ff00 ) }
		};

	this.vertexShader   = CV.Shaders.cursorVertexShader;
	this.fragmentShader = CV.Shaders.cursorFragmentShader;

	this.type = "CursorMaterial";

	return this;
}


CV.CursorMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

CV.CursorMaterial.prototype.constructor = CV.CursorMaterial;

// EOF