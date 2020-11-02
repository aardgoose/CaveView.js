export { WebGLRenderTarget } from 'three/src/renderers/WebGLRenderTarget.js';
export { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js';
export { FogExp2 } from 'three/src/scenes/FogExp2.js';
export { Scene } from 'three/src/scenes/Scene.js';
export { Mesh } from 'three/src/objects/Mesh.js';
export { LineSegments } from 'three/src/objects/LineSegments.js';
export { Line } from 'three/src/objects/Line.js';
export { Points } from 'three/src/objects/Points.js';
export { Group } from 'three/src/objects/Group.js';

export { DataTexture } from 'three/src/textures/DataTexture.js';
export { CubeTexture } from 'three/src/textures/CubeTexture.js';
export { CanvasTexture } from 'three/src/textures/CanvasTexture.js';
export { Texture } from 'three/src/textures/Texture.js';

export { SphereBufferGeometry } from 'three/src/geometries/SphereBufferGeometry.js';
export { RingBufferGeometry } from 'three/src/geometries/RingBufferGeometry.js';
export { PlaneBufferGeometry } from 'three/src/geometries/PlaneBufferGeometry.js';
export { CylinderBufferGeometry } from 'three/src/geometries/CylinderBufferGeometry.js';

export { ShaderMaterial } from 'three/src/materials/ShaderMaterial';
export { PointsMaterial } from 'three/src/materials/PointsMaterial';
export { MeshBasicMaterial } from 'three/src/materials/MeshBasicMaterial';
export { MeshLambertMaterial } from 'three/src/materials/MeshLambertMaterial';
export { MeshPhongMaterial } from 'three/src/materials/MeshPhongMaterial';
export { LineBasicMaterial } from 'three/src/materials/LineBasicMaterial';

export { TextureLoader } from 'three/src/loaders/TextureLoader.js';
export { ImageLoader } from 'three/src/loaders/ImageLoader.js';
export { FileLoader } from 'three/src/loaders/FileLoader.js';
export { Loader } from 'three/src/loaders/Loader.js';

export { HemisphereLight } from 'three/src/lights/HemisphereLight.js';
export { DirectionalLight } from 'three/src/lights/DirectionalLight.js';
export { AmbientLight } from 'three/src/lights/AmbientLight.js';

export { StereoCamera } from 'three/src/cameras/StereoCamera.js';
export { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js';
export { OrthographicCamera } from 'three/src/cameras/OrthographicCamera.js';

export { InstancedBufferGeometry } from 'three/src/core/InstancedBufferGeometry.js';
export { BufferGeometry } from 'three/src/core/BufferGeometry.js';
export { InstancedBufferAttribute } from 'three/src/core/InstancedBufferAttribute.js';
export * from 'three/src/core/BufferAttribute.js';
export { Object3D } from 'three/src/core/Object3D.js';
export { Raycaster } from 'three/src/core/Raycaster.js';
export { Layers } from 'three/src/core/Layers.js';
export { EventDispatcher } from 'three/src/core/EventDispatcher.js';
export { Triangle } from 'three/src/math/Triangle.js';
export { MathUtils  } from 'three/src/math/MathUtils.js';
export { Spherical } from 'three/src/math/Spherical.js';
export { Plane } from 'three/src/math/Plane.js';
export { Frustum } from 'three/src/math/Frustum.js';
export { Sphere } from 'three/src/math/Sphere.js';
export { Ray } from 'three/src/math/Ray.js';
export { Matrix4 } from 'three/src/math/Matrix4.js';
export { Matrix3 } from 'three/src/math/Matrix3.js';
export { Box3 } from 'three/src/math/Box3.js';
export { Box2 } from 'three/src/math/Box2.js';
export { Euler } from 'three/src/math/Euler.js';
export { Vector4 } from 'three/src/math/Vector4.js';
export { Vector3 } from 'three/src/math/Vector3.js';
export { Vector2 } from 'three/src/math/Vector2.js';
export { Quaternion } from 'three/src/math/Quaternion.js';
export { Color } from 'three/src/math/Color.js';
export * from 'three/src/constants.js';

import { MathUtils } from 'three/src/math/MathUtils.js';

MathUtils.generateUUID = function () { return null; };

import { Object3D } from 'three/src/core/Object3D.js';

Object3D.DefaultUp.set( 0, 0, 1 );

Object3D.prototype.addStatic = function ( obj ) {

	obj.matrixAutoUpdate = false;
	obj.updateMatrix();

	this.add( obj );

};
