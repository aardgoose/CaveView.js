const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)

const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );

float unpackRGBAToFloat( const in vec4 v ) {
	return dot( v, UnpackFactors );
}

uniform vec3 diffuse;
uniform float opacity;

#ifdef CV_HEIGHT

	uniform sampler2D cmap;
	varying float zMap;

#endif

#if defined( CV_DEPTH ) || defined( CV_DEPTH_CURSOR )

	uniform sampler2D depthMap;
	uniform sampler2D cmap;

	uniform vec3 modelMin;

	uniform float depthScale;
	uniform float rangeZ;
	uniform float datumShift;

	varying vec2 vTerrainCoords;
	varying float vZ;

#endif

#if defined( CV_CURSOR ) || defined( CV_DEPTH_CURSOR )

	#include <cursor_fragment_pars>

	varying float height;

#endif

#ifdef USE_DASH

	uniform float dashSize;
	uniform float dashOffset;
	uniform float gapSize;

#endif

#ifdef CV_Z

	varying float vFadeDepth;

#endif

varying float vLineDistance;

#include <common>
#include <color_pars_fragment>
#include <fog_pars_fragment>

varying vec2 vUv;
varying float vHide;

void main() {

	#include <clipping_planes_fragment>

	if ( vHide > 0.0 ) discard;

	#ifdef USE_DASH

		if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps
		if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX
 
	#endif

	if ( abs( vUv.y ) > 1.0 ) {

		float a = vUv.x;
		float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
		float len2 = a * a + b * b;
		if ( len2 > 1.0 ) discard;

	}

	vec4 diffuseColor = vec4( diffuse, opacity );

	#include <logdepthbuf_fragment>
	#include <color_fragment>

	#ifdef CV_HEIGHT

		gl_FragColor = texture2D( cmap, vec2( 1.0 - zMap, 1.0 ) ) * vec4( vColor, 1.0 );

	#endif

	#if defined( CV_DEPTH ) || defined( CV_DEPTH_CURSOR )

		float terrainHeight = unpackRGBAToFloat( texture2D( depthMap, vTerrainCoords ) );

		terrainHeight = terrainHeight * rangeZ + modelMin.z + datumShift;

		float depth = ( terrainHeight - vZ );
		float vCursor = depth; // hack

	#endif

	#ifdef CV_DEPTH

		gl_FragColor = texture2D( cmap, vec2( depth * depthScale, 1.0 ) ) * vec4( vColor, 1.0 );

	#endif

	#if defined( CV_CURSOR ) || defined( CV_DEPTH_CURSOR )

		#include <cursor_fragment>

	#endif

	#ifdef CV_BASIC

		gl_FragColor = vec4( diffuseColor.rgb, diffuseColor.a );

	#endif

	#ifdef CV_Z

		gl_FragColor = vec4( vFadeDepth, 0.0, 1.0 - vFadeDepth, diffuseColor.a );

	#endif

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>

}