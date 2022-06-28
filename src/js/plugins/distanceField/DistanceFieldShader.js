import vertexShader from './commonVertexShader.glsl';
import fragmentShader from './distanceFieldFragmentShader.glsl';

const DistanceFieldShader  = {
	uniforms: {
		'tSource': { value: null },
		'beta': { value: 1 / 256 },
		'width': { value: 1 },
		'height': { value: 1 },
		'offset': { value: null }
	},
	vertexShader: vertexShader,
	fragmentShader: fragmentShader
};

export { DistanceFieldShader };