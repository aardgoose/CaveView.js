import fragmentShader from './DistanceFieldFilterFragmentShader';
import vertexShader from './commonVertexShader.glsl';

const DistanceFieldFilterShader = {

	uniforms: {
		'tDiffuse': { value: null },
		'width': { value: 1 },
		'height': { value: 1 }
	},

	vertexShader: vertexShader,
	fragmentShader: fragmentShader

};

export { DistanceFieldFilterShader };