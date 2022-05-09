#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>

uniform float linewidth;
uniform vec2 resolution;

attribute vec3 instanceStart;
attribute vec3 instanceEnd;

attribute vec3 instanceColorStart;
attribute vec3 instanceColorEnd;

attribute float instanceHideVertex;

varying vec2 vUv;
varying float vHide;

#ifdef CV_HEIGHT

	uniform sampler2D cmap;
	uniform float minZ;
	uniform float scaleZ;
	varying float zMap;

#endif

#if defined( CV_DEPTH ) || defined( CV_DEPTH_CURSOR )

	#include <depth_vertex_pars>

	uniform float depthScale;
	varying float height;

#endif

#if defined( CV_CURSOR ) || defined( CV_DEPTH_CURSOR )

	varying float vCursor;

#endif

#if defined( CV_Z ) || defined ( CV_SCALEWIDTH )

	varying float vFadeDepth;

#endif

#ifdef CV_FOCUS

	varying vec3 vRealPosition;

#endif

#ifdef USE_DASH

	uniform float dashScale;
	attribute float instanceDistanceStart;
	attribute float instanceDistanceEnd;
	varying float vLineDistance;

#endif

void trimSegment( const in vec4 start, inout vec4 end ) {

	// trim end segment so it terminates between the camera plane and the near plane

	// conservative estimate of the near plane
	float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
	float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
	float nearEstimate = - 0.5 * b / a;

	float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

	end.xyz = mix( start.xyz, end.xyz, alpha );

}

void main() {

	#ifdef USE_COLOR

		vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

	#endif

	#ifdef USE_DASH

		vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;

	#endif

	float aspect = resolution.x / resolution.y;

	vUv = uv;

	// camera space
	vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
	vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

	// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
	// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
	// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
	// perhaps there is a more elegant solution -- WestLangley

	bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

	if ( perspective ) {

		if ( start.z < 0.0 && end.z >= 0.0 ) {

			trimSegment( start, end );

		} else if ( end.z < 0.0 && start.z >= 0.0 ) {

			trimSegment( end, start );

		}

	}

	// clip space
	vec4 clipStart = projectionMatrix * start;
	vec4 clipEnd = projectionMatrix * end;

	// ndc space
	vec2 ndcStart = clipStart.xy / clipStart.w;
	vec2 ndcEnd = clipEnd.xy / clipEnd.w;

	// direction
	vec2 dir = ndcEnd - ndcStart;

	// account for clip-space aspect ratio
	dir.x *= aspect;
	dir = normalize( dir );

	// perpendicular to dir
	vec2 offset = vec2( dir.y, - dir.x );

	// undo aspect ratio adjustment
	dir.x /= aspect;
	offset.x /= aspect;

	// sign flip
	if ( position.x < 0.0 ) offset *= - 1.0;

	// endcaps
	if ( position.y < 0.0 ) {

		offset += - dir;

	} else if ( position.y > 1.0 ) {

		offset += dir;

	}

	// adjust for linewidth
	offset *= linewidth;

	// select end
	vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

	#if defined( CV_Z ) || defined ( CV_SCALEWIDTH )

		// FIXME add POI
		// FIXME clamp for v near lines
		vec4 o = projectionMatrix * modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );

		vFadeDepth = ( 2.0 - clamp( clip.z, 0.0, 2.0 * o.z ) / o.z ) / 2.0;

		if ( ! perspective ) {

			vFadeDepth = 1.0 - vFadeDepth;

		}

		#ifdef CV_SCALEWIDTH

			offset *= max( vFadeDepth, 1.0 / linewidth );// clamp for distant lines

		#endif

	#endif

	// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
	offset /= resolution.y;

	// back to clip space
	offset *= clip.w;

	clip.xy += offset;

	#ifdef CV_CURSOR

		vCursor = instanceStart.z + ( instanceEnd.z - instanceStart.z) * position.y;

	#endif

	#ifdef CV_HEIGHT

		zMap = ( instanceStart.z + ( instanceEnd.z - instanceStart.z) * position.y - minZ ) * scaleZ;

	#endif

	#if defined( CV_DEPTH ) || defined( CV_DEPTH_CURSOR ) || defined( CV_FOCUS )

		vec3 realPosition = instanceStart + ( instanceEnd - instanceStart ) * position.y;

	#endif

	#ifdef CV_FOCUS

		vRealPosition = realPosition;

	#endif

	#if defined( CV_DEPTH ) || defined( CV_DEPTH_CURSOR )

		#include <depth_vertex>
		height = terrainHeight - realPosition.z;

	#endif

	#ifdef CV_DEPTH_CURSOR

		vCursor = height;

	#endif

	#ifdef CV_DEPTH

		// depth below terrain for this vertex, scaled in 0.0 - 1.0 range
		height *= depthScale;

	#endif

	vHide = instanceHideVertex;

	gl_Position = clip;

	vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

	#include <fog_vertex>

}