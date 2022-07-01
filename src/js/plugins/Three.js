export { cloneUniforms, mergeUniforms } from 'three/src/renderers/shaders/UniformsUtils.js';
export { Mesh } from 'three/src/objects/Mesh.js';
export { ShaderMaterial } from 'three/src/materials/ShaderMaterial.js';
export { UniformsLib } from 'three/src/renderers/shaders/UniformsLib.js';
export { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js';
export { OrthographicCamera } from 'three/src/cameras/OrthographicCamera.js';
export { BufferGeometry } from 'three/src/core/BufferGeometry.js';
export * from 'three/src/core/BufferAttribute.js';
export { Object3D } from 'three/src/core/Object3D.js';
export { EventDispatcher } from 'three/src/core/EventDispatcher.js';
export * as MathUtils from 'three/src/math/MathUtils.js';
export { Matrix3 } from 'three/src/math/Matrix3.js';
export { Vector3 } from 'three/src/math/Vector3.js';
export { Vector2 } from 'three/src/math/Vector2.js';
export * from 'three/src/constants.js';

import { Object3D } from 'three/src/core/Object3D.js';

Object3D.DefaultUp.set( 0, 0, 1 );
