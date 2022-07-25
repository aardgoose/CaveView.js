if ( accuracy >= 0.0 ) {

	float targetDistance = distance( target, vPosition );

	float f = abs( targetDistance - accuracy );
	float df = abs( fwidth( targetDistance ) );

	diffuseColor = mix( vec4( ringColor, 1.0 ), diffuseColor, smoothstep( 0.0, 4.0 * df, f ) );

}
