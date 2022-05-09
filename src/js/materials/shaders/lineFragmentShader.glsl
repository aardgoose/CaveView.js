uniform vec3 diffuse;
uniform float opacity;

#ifdef CV_HEIGHT

	uniform sampler2D cmap;
	varying float zMap;

#endif

#ifdef CV_DEPTH

	uniform sampler2D cmap;
	varying float height;

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

#ifdef CV_POINT_DISTANCE

	uniform vec3 targetPosition;
	uniform sampler2D cmap;
	uniform float dMax;

	varying vec3 vRealPosition;

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

	#ifdef CV_DEPTH

		gl_FragColor = texture2D( cmap, vec2( height, 1.0 ) ) * vec4( vColor, 1.0 );

	#endif

	#ifdef CV_POINT_DISTANCE

		float d = distance( targetPosition, vRealPosition ) / dMax;
		gl_FragColor = texture2D( cmap, vec2( d, 1.0 ) ) * vec4( vColor, 1.0 );

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