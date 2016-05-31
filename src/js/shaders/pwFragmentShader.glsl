
precision highp float;

uniform sampler2D cmap;
uniform float zoom;
uniform vec2 offset;

varying vec3 vNormal;
varying vec3 lNormal;
varying vec2 vUv;

void main() {

	float square;

	float x = 0.0;
	float y = 0.0;

	float xt;
	float yt;

	float light;

	vec2 c = ( vUv - vec2( 0.5, 0.5 ) ) * 4.0 / zoom - offset;

	for ( float i = 0.0; i < 1.0; i += 0.001 ) {

		xt = x * x - y * y + c.x;
		yt = 2.0 * x * y + c.y;

		x = xt;
		y = yt;

		square = x * x + y * y;

		light = dot( normalize( vNormal ), normalize( lNormal ) );

		gl_FragColor = texture2D( cmap, vec2( i, 1.0 ) ) * light;

		if ( square >= 4.0 ) break;

	}

}
