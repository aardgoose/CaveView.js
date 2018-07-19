import './core/polyfills';
import '../../node_modules/three/src/polyfills';

import { Cfg } from './core/lib';

// backwards compat
const setEnvironment = Cfg.set;

export * from './core/constants';
export { setEnvironment };
export { Viewer } from './viewer/Viewer';
export { UI } from './ui/UI';