import { AmbientLight, DirectionalLight, Group, MathUtils, Object3D, Vector3 } from '../Three';
import { LM_NONE, LM_SINGLE, LM_MULTIPLE } from '../core/constants';
import { lights } from 'three/examples/jsm/nodes/Nodes.js';

function LightingManager ( ctx, scene ) {

	const cfg = ctx.cfg;
	const xAxis = new Vector3( 1, 0, 0 );
	const up = Object3D.DEFAULT_UP;

	const ambient = [];

	ctx.lightingManager = this;

	ambient[ LM_SINGLE   ] = 0.3;
	ambient[ LM_MULTIPLE ] = 0.0;
	ambient[ LM_NONE     ] = 1.0;

	const ambientLight = new AmbientLight( 0xffffff, 0.3 );

	const inclination = cfg.themeAngle( 'lighting.inclination' ) * MathUtils.RAD2DEG;
	const azimuth = cfg.themeAngle( 'lighting.azimuth' ) * MathUtils.RAD2DEG;

	const surfaceLights = new Group();

	// single direction of illumination
	const directionalLight0 = _createDirectionalLight( 0xffffff, inclination, azimuth );

	//multiple directions of illumination
	const directionalLight1 = _createDirectionalLight( 0xff0000, 55, 315 );
	const directionalLight2 = _createDirectionalLight( 0x00ff00, 55, 15 );
	const directionalLight3 = _createDirectionalLight( 0x0000ff, 55, 75 );

	scene.addStatic( surfaceLights );
	scene.addStatic( ambientLight );

	const light = new DirectionalLight( 0xffffff, 1.0 );
	light.position.set( -1, -1, 2 );

	scene.addStatic( light );

	const subsurfaceLights = lights( [ light ] );

	this.mode = LM_SINGLE;

	function _createDirectionalLight ( color, alt, azimuth ) {

		const light = new DirectionalLight( color );
		const position = light.position;

		position.copy( up );
		position.applyAxisAngle( xAxis, alt * MathUtils.DEG2RAD );
		position.applyAxisAngle( up, ( azimuth - 90 ) * MathUtils.DEG2RAD );

		surfaceLights.addStatic( light );

		return light;

	}

	this.setRotation = function ( rotation ) {

		surfaceLights.setRotationFromAxisAngle( up, rotation.z );
		surfaceLights.updateMatrix();

	};

	Object.defineProperty( this, 'lightingMode', {
		get() { return this.mode; },
		set( mode ) {

			this.mode = mode;

			directionalLight0.visible = ( mode == LM_SINGLE );

			directionalLight1.visible = ( mode == LM_MULTIPLE );
			directionalLight2.visible = ( mode == LM_MULTIPLE );
			directionalLight3.visible = ( mode == LM_MULTIPLE );

			ambientLight.intensity = ambient[ mode ];

		}
	} );

	this.getSurfaceLights = function () {

		return lights( surfaceLights.children );

	}

	this.getSubsurfaceLights = function () {

		return subsurfaceLights;

	}

}

export { LightingManager };