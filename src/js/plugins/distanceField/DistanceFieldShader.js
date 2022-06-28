import distanceFieldVertexShader from './distanceFieldVertexShader.glsl';
import distanceFieldFragmentShader from './distanceFieldFragmentShader.glsl';

const DistanceFieldShader  = {
	uniforms: {
		'tSource': { value: null },
		'beta': { value: 1 / 256 },
		'width': { value: 1 },
		'height': { value: 1 },
		'offset': { value: null }
	},
	vertexShader: distanceFieldVertexShader,
	fragmentShader: distanceFieldFragmentShader
};

export { DistanceFieldShader };