export { WebGLRenderTarget } from 'three/src/renderers/WebGLRenderTarget';
export { WebGLRenderer } from 'three/src/renderers/WebGLRenderer';
export { ShaderChunk } from 'three/src/renderers/shaders/ShaderChunk';
export { cloneUniforms } from 'three/src/renderers/shaders/UniformsUtils';
export { FogExp2 } from 'three/src/scenes/FogExp2';
export { Scene } from 'three/src/scenes/Scene';
export { Mesh } from 'three/src/objects/Mesh';
export { LineSegments } from 'three/src/objects/LineSegments';
export { Line } from 'three/src/objects/Line';
export { Points } from 'three/src/objects/Points';
export { Group } from 'three/src/objects/Group';

export { DataTexture } from 'three/src/textures/DataTexture';
export { CubeTexture } from 'three/src/textures/CubeTexture';
export { CanvasTexture } from 'three/src/textures/CanvasTexture';
export { Texture } from 'three/src/textures/Texture';

export { SphereBufferGeometry } from 'three/src/geometries/SphereGeometry';
export { RingBufferGeometry } from 'three/src/geometries/RingGeometry';
export { PlaneBufferGeometry } from 'three/src/geometries/PlaneGeometry';
export { CylinderBufferGeometry } from 'three/src/geometries/CylinderGeometry';

export { ShaderMaterial } from 'three/src/materials/ShaderMaterial';
export { PointsMaterial } from 'three/src/materials/PointsMaterial';
export { MeshBasicMaterial } from 'three/src/materials/MeshBasicMaterial';
export { MeshLambertMaterial } from 'three/src/materials/MeshLambertMaterial';
export { MeshPhongMaterial } from 'three/src/materials/MeshPhongMaterial';
export { LineBasicMaterial } from 'three/src/materials/LineBasicMaterial';
export { UniformsLib } from 'three/src/renderers/shaders/UniformsLib';
export { UniformsUtils } from 'three/src/renderers/shaders/UniformsUtils';
export { TextureLoader } from 'three/src/loaders/TextureLoader';
export { ImageLoader } from 'three/src/loaders/ImageLoader';
export { FileLoader } from 'three/src/loaders/FileLoader';
export { Loader } from 'three/src/loaders/Loader';

export { HemisphereLight } from 'three/src/lights/HemisphereLight';
export { DirectionalLight } from 'three/src/lights/DirectionalLight';
export { AmbientLight } from 'three/src/lights/AmbientLight';

export { StereoCamera } from 'three/src/cameras/StereoCamera';
export { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera';
export { OrthographicCamera } from 'three/src/cameras/OrthographicCamera';

export { InstancedBufferGeometry } from 'three/src/core/InstancedBufferGeometry';
export { BufferGeometry } from 'three/src/core/BufferGeometry';
export { InstancedBufferAttribute } from 'three/src/core/InstancedBufferAttribute';
export { InstancedInterleavedBuffer } from 'three/src/core/InstancedInterleavedBuffer';
export { InterleavedBuffer } from 'three/src/core/InterleavedBuffer';
export { InterleavedBufferAttribute } from 'three/src/core/InterleavedBufferAttribute';
export * from 'three/src/core/BufferAttribute';
export { Object3D } from 'three/src/core/Object3D';
export { Raycaster } from 'three/src/core/Raycaster';
export { Layers } from 'three/src/core/Layers';
export { EventDispatcher } from 'three/src/core/EventDispatcher';
export { Triangle } from 'three/src/math/Triangle';
export * as MathUtils from 'three/src/math/MathUtils';
export { Spherical } from 'three/src/math/Spherical';
export { Plane } from 'three/src/math/Plane';
export { Frustum } from 'three/src/math/Frustum';
export { Sphere } from 'three/src/math/Sphere';
export { Ray } from 'three/src/math/Ray';
export { Matrix4 } from 'three/src/math/Matrix4';
export { Matrix3 } from 'three/src/math/Matrix3';
export { Box3 } from 'three/src/math/Box3';
export { Box2 } from 'three/src/math/Box2';
export { Euler } from 'three/src/math/Euler';
export { Vector4 } from 'three/src/math/Vector4';
export { Vector3 } from 'three/src/math/Vector3';
export { Vector2 } from 'three/src/math/Vector2';
export { Quaternion } from 'three/src/math/Quaternion';
export { Color } from 'three/src/math/Color';
export { Line3 } from 'three/src/math/Line3';
export * from 'three/src/constants';

import { Object3D } from 'three/src/core/Object3D';

Object3D.onUploadDropBuffer = function () {

	// call back from BufferAttribute to drop JS buffers after data has been transfered to GPU
	this.array = null;

};

Object3D.DefaultUp.set( 0, 0, 1 );

Object3D.prototype.addStatic = function ( obj ) {

	obj.matrixAutoUpdate = false;
	obj.updateMatrix();

	this.add( obj );

};

Object3D.prototype.dropBuffers = function ( colors = true ) {

	const geometry = this.geometry;
	const attributes = geometry.attributes;

	for ( const name in attributes )
		if ( colors || name !== 'color' ) attributes[ name ].onUpload( Object3D.onUploadDropBuffer );

	if ( geometry.index ) geometry.index.onUpload( Object3D.onUploadDropBuffer );

};