

function CursorMaterial ( type, initialHeight ) {

	THREE.ShaderMaterial.call( this );

	this.defines = {};

	if ( type === MATERIAL_LINE ) {

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

	this.vertexShader   = Shaders.cursorVertexShader;
	this.fragmentShader = Shaders.cursorFragmentShader;

	this.type = "CV.CursorMaterial";

	return this;
}


CursorMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

CursorMaterial.prototype.constructor = CursorMaterial;

export { CursorMaterial };

// EOF