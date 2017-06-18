#define RECIPROCAL_PI 0.31830988618

uniform sampler2D cmap;
uniform float surfaceOpacity;

varying float vAspect;
varying vec3 vNormal;

void main() {

	float nDot = dot( normalize( vNormal ), vec3( 0.0, 0.0, 1.0 ) );

	gl_FragColor = mix( texture2D( cmap, vec2( vAspect, 1.0 ) ), vec4( 1.0, 1.0, 1.0, surfaceOpacity ), ( abs( nDot ) ) * 0.4 );


}