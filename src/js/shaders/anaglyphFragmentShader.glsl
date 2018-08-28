
uniform sampler2D mapLeft;
uniform sampler2D mapRight;
varying vec2 vUv;

uniform mat3 colorMatrixLeft;
uniform mat3 colorMatrixRight;

// These functions implement sRGB linearization and gamma correction

float lin( float c ) {

	return c <= 0.04045 ? c * 0.0773993808 : pow( c * 0.9478672986 + 0.0521327014, 2.4 );

}

vec4 lin( vec4 c ) {

	return vec4( lin( c.r ), lin( c.g ), lin( c.b ), c.a );

}

float dev( float c ) {

	return c <= 0.0031308 ? c * 12.92 : pow( c, 0.41666 ) * 1.055 - 0.055;

}

void main() {

	vec2 uv = vUv;

	vec4 colorL = lin( texture2D( mapLeft, uv ) );
	vec4 colorR = lin( texture2D( mapRight, uv ) );

	vec3 color = clamp(
			colorMatrixLeft * colorL.rgb +
			colorMatrixRight * colorR.rgb, 0., 1.
	);

	gl_FragColor = vec4(
			dev( color.r ), dev( color.g ), dev( color.b ),
			max( colorL.a, colorR.a )
	);

}
