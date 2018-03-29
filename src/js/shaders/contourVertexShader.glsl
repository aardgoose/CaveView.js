#define saturate(a) clamp( a, 0.0, 1.0 )

uniform float datumShift;
uniform float zAdjust;
uniform vec3 uLight;
uniform vec3 baseColor;

varying float vPositionZ;
varying vec3 vBaseColor;

void main() {

	vec3 sNormal = normalMatrix * normal;

	float dotNL = dot( normalize( sNormal ), uLight );

	vBaseColor = saturate( dotNL ) * baseColor;

	// FIXME ( single uniform )
	vPositionZ = position.z + zAdjust + datumShift;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
