
import { Color } from '../Three';

var MaterialFog = {

	uniforms: {
		fogNear: { value: 1 },
		fogFar: { value: 300 },
		fogColor: { value: new Color( 0x222222 ) },
		fogEnabled: { value: 0 }
	}

};

export { MaterialFog };