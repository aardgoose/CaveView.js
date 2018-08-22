
import { Float32BufferAttribute, Uint16BufferAttribute } from '../Three';

// attributes to construct unit square

const indexAttribute = new Uint16BufferAttribute( [ 0, 2, 1, 0, 3, 2 ], 1 );

const positionAttribute = new Float32BufferAttribute( [
	0, 0, 0,
	0, 1, 0,
	1, 1, 0,
	1, 0, 0
], 3 );


const CommonAttributes = {
	index: indexAttribute,
	position: positionAttribute
};

export { CommonAttributes };