import { materialColor, abs, cond, distance, float, fwidth, mix, smoothstep, texture, varying, vec3, vec4, positionGeometry, positionLocal } from '../Nodes.js';

class CommonComponents {

    static cursorColor ( ctx, delta ) {

        const materials = ctx.materials;
        const baseColor = materials.getColorUniform( 'shading.cursorBase' );
        const cursorColor = materials.getColorUniform( 'shading.cursor' );
        const cursorWidth = materials.getReference( 'cursorWidth' );

        const aDelta = abs( delta );
        const ss = smoothstep( 0.0, cursorWidth, cursorWidth.sub( aDelta ) );

        return cond( aDelta.lessThan( cursorWidth.mul( 0.05 ) ),
            vec4( materialColor, 1.0 ),
            vec4( mix( baseColor, cursorColor, ss ), 1.0 ).mul( materialColor, 1.0 )
        );

    }

    static terrainHeight ( du, terrain, position ) {

        // check calcs
        const UnpackDownscale = float( 255. / 256. ); // 0..1 -> fraction (excluding 1)

		const PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
		const UnpackFactors = vec4( UnpackDownscale.div( vec4( PackFactors, 1. ) ) );

		const vTerrainCoords = varying( position.xy.sub( du.modelMin.xy ).mul( du.scale ) );

		const terrainHeight = texture( terrain.depthTexture, vTerrainCoords ).dot( UnpackFactors ); // FIXME

		return terrainHeight.mul( du.rangeZ ).add( du.modelMin.z ).add( du.datumShift );

    }

    static location ( ctx, color ) {

        const lu = ctx.materials.commonUniforms.location( ctx );

        const targetDistance = distance( lu.target, positionLocal.xy );

        const f = abs( targetDistance.sub( lu.accuracy ) );
        const df = abs( fwidth( targetDistance ) );

        return cond( lu.accuracy.greaterThanEqual( 0 ),
            mix( vec4( lu.ringColor, 1.0 ), color, smoothstep( 0.0, df.mul( 4.0 ), f ) ),
            color
         );

    }

    static distanceFade( dfu ) {

        return smoothstep( dfu.distanceFadeMin, dfu.distanceFadeMax, distance( dfu.cameraLocation, vPosition ) ).oneMinus();

    }

}
export { CommonComponents };
/*

const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)

const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;

vec4 packFloatToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8; // tidy overflow
	return r * PackUpscale;
}

float unpackRGBAToFloat( const in vec4 v ) {
	return dot( v, UnpackFactors );
} */