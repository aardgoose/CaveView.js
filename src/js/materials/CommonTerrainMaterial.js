
import {
	Vector2, Color,
	EqualStencilFunc,
	CustomBlending, NormalBlending, OneMinusDstAlphaFactor, DstAlphaFactor
} from '../Three';

import { TERRAIN_BLEND, TERRAIN_STENCIL } from '../core/constants';

function CommonTerrainMaterial () {}

CommonTerrainMaterial.uniforms = {
	scale: { value: 0.0 },
	accuracy: { value: 0.0 },
	target: { value: new Vector2() },
	ringColor: { value: new Color( 0xff0000 ) }
};

CommonTerrainMaterial.prototype.setThroughMode = function ( mode ) {

	switch ( mode ) {

	case TERRAIN_BLEND:

		this.stencilWrite = false;

		this.blending = CustomBlending;
		this.blendSrc = OneMinusDstAlphaFactor;
		this.blendDst = DstAlphaFactor;

		break;

	case TERRAIN_STENCIL:

		this.blending = NormalBlending;

		this.stencilWrite = true;
		this.stencilFunc = EqualStencilFunc;

		break;

	}

	//this.needsUpdate = true;

};

export { CommonTerrainMaterial };
// EOF