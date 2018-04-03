
import { Cfg } from '../core/lib';

var MaterialFog = {

	uniforms: {
		fogNear: { value: 1 },
		fogFar: { value: 300 },
		fogColor: { value: Cfg.themeColor( 'background' ) },
		fogEnabled: { value: 0 }
	}

};

export { MaterialFog };