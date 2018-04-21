#define saturate(a) clamp( a, 0.0, 1.0 )

uniform vec3 uLight;

varying vec3 vColor;
varying float height;
varying float fogDepth;

void main() {

#ifdef SURFACE

	vec3 sNormal = normalMatrix * normal;

	float dotNL = dot( normalize( sNormal ), uLight );

	vColor = saturate( dotNL ) * color + vec3( 0.3, 0.3, 0.3 );

#else

	vColor = color;

#endif

	height = position.z;

	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	fogDepth = -mvPosition.z;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
