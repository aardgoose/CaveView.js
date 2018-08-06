export { WebGLRenderTarget } from 'three/src/renderers/WebGLRenderTarget.js';
export { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js';
export { ShaderLib } from 'three/src/renderers/shaders/ShaderLib.js';
export { UniformsLib } from 'three/src/renderers/shaders/UniformsLib.js';
export { UniformsUtils } from 'three/src/renderers/shaders/UniformsUtils.js';
export { ShaderChunk } from 'three/src/renderers/shaders/ShaderChunk.js';
export { FogExp2 } from 'three/src/scenes/FogExp2.js';
export { Scene } from 'three/src/scenes/Scene.js';
export { Mesh } from 'three/src/objects/Mesh.js';
export { LineSegments } from 'three/src/objects/LineSegments.js';
export { Line } from 'three/src/objects/Line.js';
export { Points } from 'three/src/objects/Points.js';
export { Group } from 'three/src/objects/Group.js';
export { VideoTexture } from 'three/src/textures/VideoTexture.js';
export { DataTexture } from 'three/src/textures/DataTexture.js';
export { CanvasTexture } from 'three/src/textures/CanvasTexture.js';
export { Texture } from 'three/src/textures/Texture.js';

export { SphereBufferGeometry } from 'three/src/geometries/SphereGeometry.js';
export { RingGeometry, RingBufferGeometry } from 'three/src/geometries/RingGeometry.js';
export { PlaneGeometry, PlaneBufferGeometry } from 'three/src/geometries/PlaneGeometry.js';
export { CylinderBufferGeometry } from 'three/src/geometries/CylinderGeometry.js';

export * from 'three/src/materials/Materials.js';
export { TextureLoader } from 'three/src/loaders/TextureLoader.js';
export { DefaultLoadingManager, LoadingManager } from 'three/src/loaders/LoadingManager.js';
export { ImageLoader } from 'three/src/loaders/ImageLoader.js';
export { FileLoader } from 'three/src/loaders/FileLoader.js';
export { Loader } from 'three/src/loaders/Loader.js';
export { LoaderUtils } from 'three/src/loaders/LoaderUtils.js';
export { Cache } from 'three/src/loaders/Cache.js';
export { HemisphereLight } from 'three/src/lights/HemisphereLight.js';
export { DirectionalLight } from 'three/src/lights/DirectionalLight.js';
export { AmbientLight } from 'three/src/lights/AmbientLight.js';
export { Light } from 'three/src/lights/Light.js';
export { StereoCamera } from 'three/src/cameras/StereoCamera.js';
export { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js';
export { OrthographicCamera } from 'three/src/cameras/OrthographicCamera.js';
export { ArrayCamera } from 'three/src/cameras/ArrayCamera.js';
export { Camera } from 'three/src/cameras/Camera.js';
export { Uniform } from 'three/src/core/Uniform.js';
export { InstancedBufferGeometry } from 'three/src/core/InstancedBufferGeometry.js';
export { BufferGeometry } from 'three/src/core/BufferGeometry.js';
export { Geometry } from 'three/src/core/Geometry.js';
export { InstancedBufferAttribute } from 'three/src/core/InstancedBufferAttribute.js';
export * from 'three/src/core/BufferAttribute.js';
export { Face3 } from 'three/src/core/Face3.js';
export { Object3D } from 'three/src/core/Object3D.js';
export { Raycaster } from 'three/src/core/Raycaster.js';
export { Layers } from 'three/src/core/Layers.js';
export { EventDispatcher } from 'three/src/core/EventDispatcher.js';
export { Triangle } from 'three/src/math/Triangle.js';
export { _Math as Math } from 'three/src/math/Math.js';
export { Spherical } from 'three/src/math/Spherical.js';
export { Plane } from 'three/src/math/Plane.js';
export { Frustum } from 'three/src/math/Frustum.js';
export { Sphere } from 'three/src/math/Sphere.js';
export { Ray } from 'three/src/math/Ray.js';
export { Matrix4 } from 'three/src/math/Matrix4.js';
export { Matrix3 } from 'three/src/math/Matrix3.js';
export { Box3 } from 'three/src/math/Box3.js';
export { Box2 } from 'three/src/math/Box2.js';
export { Line3 } from 'three/src/math/Line3.js';
export { Euler } from 'three/src/math/Euler.js';
export { Vector4 } from 'three/src/math/Vector4.js';
export { Vector3 } from 'three/src/math/Vector3.js';
export { Vector2 } from 'three/src/math/Vector2.js';
export { Quaternion } from 'three/src/math/Quaternion.js';
export { Color } from 'three/src/math/Color.js';
export { QuadraticBezierCurve3 } from 'three/src/extras/curves/QuadraticBezierCurve3.js';
export * from 'three/src/constants.js';

import { _Math } from 'three/src/math/Math.js';

_Math.generateUUID = function () { return null; };

import { Object3D } from 'three/src/core/Object3D.js';

Object3D.DefaultUp.set( 0, 0, 1 );

Object3D.prototype.addStatic = function ( obj ) {

	obj.matrixAutoUpdate = false;
	obj.updateMatrix();

	this.add( obj );

};
