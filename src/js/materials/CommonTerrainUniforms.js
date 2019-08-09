
import { Vector2, Color } from 'three';

const CommonTerrainUniforms = {
	scale: { value: 1.0 },
	accuracy: { value: 0.0 },
	target: { value: new Vector2() },
	ringColor: { value: new Color( 0xff0000 ) }
};

export { CommonTerrainUniforms };

// EOF