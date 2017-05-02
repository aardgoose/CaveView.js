
import { Shaders } from '../shaders/Shaders';

import { ShaderMaterial, Color } from '../../../../three.js/src/Three';

function DepthCursorMaterial ( limits, texture, initialDepth ) {

	var range = limits.getSize();

	ShaderMaterial.call( this, {

		uniforms: {
			minX:           { value: limits.min.x },
			minY:           { value: limits.min.y },
			minZ:           { value: limits.min.z },
			scaleX:         { value: 1 / range.x },
			scaleY:         { value: 1 / range.y },
			scaleZ:         { value: range.z },
			depthMap:       { value: texture },
			cursor:         { value: initialDepth },
			cursorWidth:    { value: 5.0 },
			baseColor:      { value: new Color( 0x888888 ) },
			cursorColor:    { value: new Color( 0x00ff00 ) }
		},
		vertexShader: Shaders.depthCursorVertexShader,
		fragmentShader: Shaders.depthCursorFragmentShader
	} );

	this.type = 'CV.DepthCursorMaterial';
	this.depthMap = texture;
	this.defines = { USE_COLOR: true };

	this.addEventListener( 'dispose', _onDispose );

	return this;

	function _onDispose( event ) {

		var obj = event.target;

		obj.removeEventListener( 'dispose', _onDispose );

		// dispose of depthMap texture

		obj.depthMap.dispose();

	}

}

DepthCursorMaterial.prototype = Object.create( ShaderMaterial.prototype );

DepthCursorMaterial.prototype.constructor = DepthCursorMaterial;

export { DepthCursorMaterial };

// EOF