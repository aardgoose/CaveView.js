#define saturate(a) clamp( a, 0.0, 1.0 )

uniform vec3 uLight;

varying vec3 vColor;
varying float height;

void main() {

#ifdef SURFACE

	vec3 sNormal = normalMatrix * normal;

	float dotNL = dot( normalize( sNormal ), uLight );

	vColor = saturate( dotNL ) * color + vec3( 0.3, 0.3, 0.3 );

#else

	vColor = color;

#endif

	height = position.z;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
