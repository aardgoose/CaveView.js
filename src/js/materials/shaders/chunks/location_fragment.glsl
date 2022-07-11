if ( scale > 0.0 ) {
	float targetDistance = distance( target, vPosition );
	float f = abs( targetDistance - accuracy ) * scale;
	float c = smoothstep( 1.0, 4.0, f );
	diffuseColor = mix( vec4( ringColor, 1.0 ), diffuseColor, c );
}
