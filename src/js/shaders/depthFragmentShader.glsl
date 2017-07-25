
uniform sampler2D cmap;
varying float vDepth;

#ifdef SURFACE

varying vec3 vNormal;
varying vec3 lNormal;

#else

varying vec3 vColor;

#endif

void main() {

#ifdef SURFACE

	float nDot = dot( normalize( vNormal ), normalize( lNormal ) );
	float light;
	light = 0.5 * ( nDot + 1.0 );

	gl_FragColor = texture2D( cmap, vec2( vDepth, 1.0 ) ) * light;

#else

	gl_FragColor = texture2D( cmap, vec2( vDepth, 1.0 ) ) * vec4( vColor, 1.0 );

#endif

}
