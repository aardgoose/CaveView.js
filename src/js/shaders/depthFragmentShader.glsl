
uniform sampler2D cmap;
varying float vDepth;

#ifdef SURFACE

uniform vec3 uLight;

varying vec3 vNormal;

#else

varying vec3 vColor;

#endif

void main() {

#ifdef SURFACE

	float nDot = dot( normalize( vNormal ), uLight );
	float light = 0.5 * ( nDot + 1.0 );

	gl_FragColor = texture2D( cmap, vec2( vDepth, 1.0 ) ) * light;

#else

	gl_FragColor = texture2D( cmap, vec2( vDepth, 1.0 ) ) * vec4( vColor, 1.0 );

#endif

}
