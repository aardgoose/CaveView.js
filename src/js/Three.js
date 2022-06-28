export { WebGLRenderTarget } from 'three/src/renderers/WebGLRenderTarget.js';
export { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js';
export { ShaderChunk } from 'three/src/renderers/shaders/ShaderChunk.js';
export { cloneUniforms, mergeUniforms } from 'three/src/renderers/shaders/UniformsUtils.js';
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
export { Source } from 'three/src/textures/Source.js';

export { SphereBufferGeometry } from 'three/src/geometries/SphereGeometry.js';
export { RingBufferGeometry } from 'three/src/geometries/RingGeometry.js';
export { PlaneBufferGeometry } from 'three/src/geometries/PlaneGeometry.js';
export { CylinderBufferGeometry } from 'three/src/geometries/CylinderGeometry.js';

export { ShaderMaterial } from 'three/src/materials/ShaderMaterial.js';
export { PointsMaterial } from 'three/src/materials/PointsMaterial.js';
export { MeshBasicMaterial } from 'three/src/materials/MeshBasicMaterial.js';
export { MeshLambertMaterial } from 'three/src/materials/MeshLambertMaterial.js';
export { MeshPhongMaterial } from 'three/src/materials/MeshPhongMaterial.js';
export { LineBasicMaterial } from 'three/src/materials/LineBasicMaterial.js';
export { UniformsLib } from 'three/src/renderers/shaders/UniformsLib.js';
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
export { InstancedInterleavedBuffer } from 'three/src/core/InstancedInterleavedBuffer.js';
export { InterleavedBuffer } from 'three/src/core/InterleavedBuffer.js';
export { InterleavedBufferAttribute } from 'three/src/core/InterleavedBufferAttribute.js';
export * from 'three/src/core/BufferAttribute.js';
export { Object3D } from 'three/src/core/Object3D.js';
export { Raycaster } from 'three/src/core/Raycaster.js';
export { Layers } from 'three/src/core/Layers.js';
export { EventDispatcher } from 'three/src/core/EventDispatcher.js';
export { Triangle } from 'three/src/math/Triangle.js';
export * as MathUtils from 'three/src/math/MathUtils.js';
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
export { Line3 } from 'three/src/math/Line3.js';
export * from 'three/src/constants.js';

import { Object3D } from 'three/src/core/Object3D.js';

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