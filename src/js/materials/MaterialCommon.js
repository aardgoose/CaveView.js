
import { Cfg } from '../core/lib';

var MaterialCommon = {

	uniforms: {
		fogColor: { value: Cfg.themeColor( 'background' ) },
		fogDensity: { value: 0.0025 },
		fogEnabled: { value: 0 },
		distanceTransparency: { value: 0.0 }
	}

};

export { MaterialCommon };