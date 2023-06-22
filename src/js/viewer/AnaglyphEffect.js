/**
 * @author mrdoob / http://mrdoob.com/
 * @author marklundin / http://mark-lundin.com/
 * @author alteredq / http://alteredqualia.com/
 * @author tschw
 */

import {
	LinearFilter,
	Matrix3,
	Mesh,
	NearestFilter,
	OrthographicCamera,
	PlaneGeometry,
	RGBAFormat,
	Scene,
	ShaderMaterial,
	StereoCamera,
	WebGLRenderTarget
} from '../Three';

//import { Shaders } from '../materials/shaders/Shaders';

function AnaglyphEffect ( renderer, width, height ) {

	// Matrices generated with angler.js https://github.com/tschw/angler.js/
	// (in column-major element order, as accepted by WebGL)

	this.colorMatrixLeft = new Matrix3().fromArray( [

		1.0671679973602295, 	-0.0016435992438346148,		 0.0001777536963345483, // r out
		-0.028107794001698494,	-0.00019593400065787137,	-0.0002875397040043026, // g out
		-0.04279090091586113,	 0.000015809757314855233,	-0.00024287120322696865 // b out

	] );

	//	red						green 						blue  						in

	this.colorMatrixRight = new Matrix3().fromArray( [

		-0.0355340838432312,	-0.06440307199954987,		 0.018319187685847282,	// r out
		-0.10269022732973099,	 0.8079727292060852,		-0.04835830628871918,	// g out
		0.0001224992738571018,	-0.009558862075209618,		 0.567823588848114		// b out

	] );

	const _camera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );

	const _scene = new Scene();

	const _stereo = new StereoCamera();

	_stereo.cameraL.layers.mask = 0xFFFFFFFF;
	_stereo.cameraR.layers.mask = 0xFFFFFFFF;

	const _params = { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBAFormat };

	if ( width === undefined ) width = 512;
	if ( height === undefined ) height = 512;

	const pixelRatio = renderer.getPixelRatio();

	const _renderTargetL = new WebGLRenderTarget( width * pixelRatio, height * pixelRatio, _params );
	const _renderTargetR = new WebGLRenderTarget( width * pixelRatio, height * pixelRatio, _params );

	const _material = new ShaderMaterial( {

		uniforms: {

			'mapLeft': { value: _renderTargetL.texture },
			'mapRight': { value: _renderTargetR.texture },

			'colorMatrixLeft': { value: this.colorMatrixLeft },
			'colorMatrixRight': { value: this.colorMatrixRight }

		},

//		vertexShader: Shaders.anaglyphVertexShader,
//		fragmentShader: Shaders.anaglyphFragmentShader

	} );

	const _mesh = new Mesh( new PlaneGeometry( 2, 2 ), _material );
	_scene.add( _mesh );

	this.setLayers = function ( mask ) {

		_stereo.cameraL.layers.mask = mask;
		_stereo.cameraR.layers.mask = mask;

	};

	this.setSize = function ( width, height ) {

		renderer.setSize( width, height );

		const pixelRatio = renderer.getPixelRatio();

		_renderTargetL.setSize( width * pixelRatio, height * pixelRatio );
		_renderTargetR.setSize( width * pixelRatio, height * pixelRatio );

	};

	this.setEyeSeparation = function ( x ) {

		_stereo.eyeSep = x;

	};

	this.render = function ( scene, camera ) {

		scene.updateMatrixWorld();

		if ( camera.parent === null ) camera.updateMatrixWorld();

		_stereo.update( camera );

		renderer.setRenderTarget( _renderTargetL );
		renderer.clear();
		renderer.render( scene, _stereo.cameraL );

		renderer.setRenderTarget( _renderTargetR );
		renderer.clear();
		renderer.render( scene, _stereo.cameraR );

		renderer.setRenderTarget( null );
		renderer.render( _scene, _camera );

	};

	this.dispose = function() {

		_renderTargetL.dispose();
		_renderTargetR.dispose();

		_material.dispose();
		_mesh.geometry.dispose();

	};

}

export { AnaglyphEffect };