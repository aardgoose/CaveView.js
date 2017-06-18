
uniform sampler2D cmap;

varying float zMap;

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

	gl_FragColor = texture2D( cmap, vec2( 1.0 - zMap, 1.0 ) ) * vec4( light, light, light, 1.0 );

#else

	gl_FragColor = texture2D( cmap, vec2( 1.0 - zMap, 1.0 ) ) * vec4( vColor, 1.0 );

#endif

}
