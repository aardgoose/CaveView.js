#define RECIPROCAL_PI 0.31830988618

uniform sampler2D cmap;
uniform float surfaceOpacity;

varying float vAspect;
varying vec3 vNormal;

uniform vec3 uLight;

void main() {

	float nDot = dot( normalize( vNormal ), normalize( uLight ) );
	float light = abs( acos( nDot ) * RECIPROCAL_PI ) * 5.5;

//	gl_FragColor = texture2D( cmap, vec2( vAspect, 1.0 ) );
	gl_FragColor = texture2D( cmap, vec2( vAspect, 1.0 ) ) * vec4( light, light, light, surfaceOpacity );

}