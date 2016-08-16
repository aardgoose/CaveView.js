

function DepthMapMaterial ( minHeight, maxHeight ) {

	THREE.ShaderMaterial.call( this, {

		uniforms: {

			minZ:   { value: minHeight },
			scaleZ: { value: 1 / ( maxHeight - minHeight ) }

		},

		vertexShader:    Shaders.depthMapVertexShader,
		fragmentShader:  Shaders.depthMapFragmentShader,
		depthWrite:      false,
		type:            "CV.DepthMapMaterial"

	} );

	return this;

}

DepthMapMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

DepthMapMaterial.prototype.constructor = DepthMapMaterial;

export { DepthMapMaterial };

// EOF