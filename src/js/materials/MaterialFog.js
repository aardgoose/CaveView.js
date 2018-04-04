
import { Cfg } from '../core/lib';

var MaterialFog = {

	uniforms: {
		fogColor: { value: Cfg.themeColor( 'background' ) },
		fogDensity: { value: 0.0025 },
		fogEnabled: { value: 0 }
	}

};

export { MaterialFog };