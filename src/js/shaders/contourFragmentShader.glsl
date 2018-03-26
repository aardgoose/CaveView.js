
uniform vec3 contourColor;
uniform float contourInterval;

varying vec3 vPosition;

void main() {

	float f  = fract ( vPosition.z / contourInterval );
	float df = fwidth( vPosition.z / contourInterval );

	float c = 1.0 - smoothstep( df * 1.0, df * 2.0, f );

	gl_FragColor = vec4( c * contourColor, 1.0);

}

