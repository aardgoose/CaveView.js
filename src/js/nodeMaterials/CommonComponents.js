import { expression, abs, cond, float, mix, smoothstep, texture, varying, vec3, vec4, positionGeometry } from 'three/examples/jsm/nodes/Nodes.js';

class CommonComponents {

    static cursorColor ( cu, delta ) {

        const aDelta = abs( delta );
        const ss = smoothstep( 0.0, cu.cursorWidth, cu.cursorWidth.sub( aDelta ) );

        return cond( aDelta.lessThan( cu.cursorWidth.mul( 0.05 ) ),
            vec4( expression( 'vColor', 'vec3' ), 1.0 ),
            vec4( mix( cu.baseColor, cu.cursorColor, ss ), 1.0 ).mul( expression( 'vColor', 'vec3' ), 1.0 )
        );

    }

    static terrainHeight( du, terrain ) {

        const UnpackDownscale = float( 255. / 256. ); // 0..1 -> fraction (excluding 1)

		const PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
		const UnpackFactors = vec4( UnpackDownscale.div( vec4( PackFactors, 1. ) ) );

		const vTerrainCoords = varying( positionGeometry.xy.sub( du.modelMin.xy ).mul( du.scale ) );

		const terrainHeight = texture( terrain.depthTexture, vTerrainCoords ).dot( UnpackFactors ); // FIXME

		return terrainHeight.mul( du.rangeZ ).add( du.modelMin.z ).add( du.datumShift );

    }

}

export { CommonComponents };