import { Cfg } from './core/lib';

// backwards compat
const setEnvironment = Cfg.set;

import '../../../three.js/src/polyfills';
export * from './core/constants';
export { setEnvironment };
export { Viewer } from './viewer/Viewer';
export { UI } from './ui/UI';
export { CaveLoader } from './loaders/CaveLoader';
