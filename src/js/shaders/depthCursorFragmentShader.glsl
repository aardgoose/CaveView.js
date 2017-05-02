
uniform float cursor;
uniform float cursorWidth;

uniform vec3 baseColor;
uniform vec3 cursorColor;

varying vec3 vColor;
varying float vHeight;

void main() {

	float delta = abs( vHeight - cursor );
	float ss = smoothstep( 0.0, cursorWidth, cursorWidth - delta );

	if ( delta < cursorWidth * 0.05 ) {

		gl_FragColor = vec4( vColor, 1.0 );

	} else {

		gl_FragColor = vec4( mix( baseColor, cursorColor, ss ), 1.0 ) * vec4( vColor, 1.0 );

	}

}