import {
	EqualStencilFunc,
	CustomBlending, NormalBlending, OneMinusDstAlphaFactor, DstAlphaFactor
} from '../Three';

import { TERRAIN_BLEND, TERRAIN_STENCIL, TERRAIN_BASIC } from '../core/constants';

function CommonTerrainMaterial () {}

CommonTerrainMaterial.prototype.setThroughMode = function ( mode ) {

	this.stencilWrite = false;
	this.blending = NormalBlending;

	switch ( mode ) {

	case TERRAIN_BLEND:

		this.blending = CustomBlending;
		this.blendSrc = OneMinusDstAlphaFactor;
		this.blendDst = DstAlphaFactor;

		break;

	case TERRAIN_STENCIL:

		this.stencilWrite = true;
		this.stencilFunc = EqualStencilFunc;

		break;

	case TERRAIN_BASIC:

		break;

	}

};

export { CommonTerrainMaterial };
// EOF