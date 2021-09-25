#define saturate(a) clamp( a, 0.0, 1.0 )

const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)

const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );

float unpackRGBAToFloat( const in vec4 v ) {
	return dot( v, UnpackFactors );
}

#include <fog_pars_vertex>

uniform vec3 modelMin;

uniform float scaleX;
uniform float scaleY;
uniform float rangeZ;

uniform sampler2D depthMap;
uniform float datumShift;
uniform vec3 uLight;

varying vec3 vColor;
varying float vDepth;

void main() {

	vec3 sNormal = normalMatrix * normal;

	float dotNL = dot( normalize( sNormal ), uLight );

	vColor = saturate( dotNL ) * color + vec3( 0.3, 0.3, 0.3 );

	vec2 terrainCoords = vec2( ( position.x - modelMin.x ) * scaleX, ( position.y - modelMin.y ) * scaleY );

	float terrainHeight = unpackRGBAToFloat( texture2D( depthMap, terrainCoords ) );

	vDepth = terrainHeight * rangeZ + datumShift + modelMin.z - position.z;

	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

	#include <fog_vertex>

}