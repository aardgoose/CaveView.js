import {
	EqualStencilFunc,
	CustomBlending, NormalBlending, OneMinusDstAlphaFactor, DstAlphaFactor,
	MeshLambertMaterial
} from '../Three';

import { TERRAIN_BLEND, TERRAIN_STENCIL, TERRAIN_BASIC } from '../core/constants';

class CommonTerrainMaterial extends MeshLambertMaterial {

	editShader ( shader, vertexPars, vertexMain, fragmentPars, fragmentColor ) {

		const vertexShader = shader.vertexShader
			.replace( '#include <common>', '$&\n' + vertexPars )
			.replace( 'include <begin_vertex>', '$&\n' + vertexMain );

		const fragmentShader = shader.fragmentShader
			.replace( '#include <common>', '$&\n' + fragmentPars )
			.replace( '#include <color_fragment>', fragmentColor );

		shader.vertexShader = vertexShader;
		shader.fragmentShader = fragmentShader;

	}

	setThroughMode ( mode ) {

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

	}

}

export { CommonTerrainMaterial };