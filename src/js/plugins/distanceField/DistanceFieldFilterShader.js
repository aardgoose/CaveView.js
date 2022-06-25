
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

        uniform sampler2D tDiffuse;
        varying vec2 vUV;

		void main() {

            vec4 colour = texture2D( tDiffuse, vUV );

            if ( all( equal( colour.rgb, vec3( 0.0, 0.0, 0.0 ) ) ) ) {

                colour.rgb = vec3( 1.0, 0.0, 0.0 );

            } else {

                colour.rgb = vec3( 0.0, 0.0, 1.0 );

            }

            gl_FragColor = colour;

		}`

};

export { DistanceFieldFilterShader };