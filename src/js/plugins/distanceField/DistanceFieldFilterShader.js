
const DistanceFieldFilterShader = {

	uniforms: {
		'tDiffuse': { value: null },
		'width': { value: 1 },
		'height': { value: 1 }
	},

	vertexShader: /* glsl */`

		varying vec2 vUV;

		void main() {

			vUV = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

		}`,

	fragmentShader: /* glsl */`
/*
		const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
		const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
		const float ShiftRight8 = 1. / 256.;

		vec4 packDepthToRGBA( const in float v ) {
			vec4 r = vec4( fract( v * PackFactors ), v );
			r.yzw -= r.xyz * ShiftRight8; // tidy overflow
			return r * PackUpscale;
		}
*/
		const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
		const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
		
		const float ShiftRight8 = 1. / 256.;
		
		vec4 packFloatToRGBA( const in float v ) {
		
			vec4 r = vec4( fract( v * PackFactors ), v );
		
			r.yzw -= r.xyz * ShiftRight8; // tidy overflow
		
			return r * PackUpscale;
		
		}
        uniform sampler2D tDiffuse;
        varying vec2 vUV;

		void main() {

            vec4 colour = texture2D( tDiffuse, vUV );

            if ( all( lessThan( colour.rgb, vec3( 0.9, 0.9, 0.9 ) ) ) ) {

                gl_FragColor = packFloatToRGBA( 0.0 );

            } else {

                gl_FragColor = packFloatToRGBA( 0.9999 );

            }

//            gl_FragColor = colour;

		}`

};

export { DistanceFieldFilterShader };