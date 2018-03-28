
uniform vec3 contourColor;
uniform vec3 contourColor10;
uniform float contourInterval;
uniform vec3 baseColor;
uniform float opacity;
uniform vec3 uLight;

varying float vPositionZ;
varying vec3 vNormal;
varying vec3 lNormal;

void main() {

	float f  = fract ( vPositionZ / contourInterval );
	float f10  = fract ( ( vPositionZ ) / ( contourInterval * 10.0 ) );

	float df = fwidth( vPositionZ / contourInterval );

	float contourColourSelection = step( 0.90, f10 );
	float c = 1.0 - smoothstep( df * 1.0, df * 2.0, f );

	vec4 finalColour = vec4( mix( contourColor, contourColor10, contourColourSelection ), 1.0 );

	float nDot = dot( normalize( vNormal ), uLight );
	float light = 0.5 * ( nDot + 1.0 );

	vec4 baseColourAlpha = vec4( baseColor * light, opacity );

	gl_FragColor = mix( baseColourAlpha, finalColour, c );

}

