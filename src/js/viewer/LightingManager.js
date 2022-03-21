import { LM_SINGLE, LM_MULTIPLE } from '../core/constants';
import { Spherical, Vector3, Object3D, Group, AmbientLight, DirectionalLight, MathUtils } from '../Three';


function LightingManager ( ctx, scene ) {

	const cfg = ctx.cfg;
	const xAxis = new Vector3( 1, 0, 0 );
	const up = Object3D.DefaultUp;

	const lightPosition0 = new Vector3();
	const lightPosition1 = new Vector3();
	const lightPosition2 = new Vector3();
	const lightPosition3 = new Vector3();

	const directionalLight0 = new DirectionalLight( 0xffffff );
	const directionalLight1 = new DirectionalLight( 0xff0000 );
	const directionalLight2 = new DirectionalLight( 0x00ff00 );
	const directionalLight3 = new DirectionalLight( 0x0000ff );

	const ambientLight = new AmbientLight( 0xffffff, 0.3 );

	const inclination = cfg.themeAngle( 'lighting.inclination' );
	const azimuth = cfg.themeAngle( 'lighting.azimuth' ) - Math.PI / 2;

	lightPosition0.setFromSpherical( new Spherical( 1, inclination, azimuth ) );
	lightPosition0.applyAxisAngle( xAxis, Math.PI / 2 );

	lightPosition1.copy( up );
	lightPosition1.applyAxisAngle( xAxis, 55 * MathUtils.DEG2RAD );
	lightPosition1.applyAxisAngle( up, ( 315 - 90 ) * MathUtils.DEG2RAD );

	lightPosition2.copy( up );
	lightPosition2.applyAxisAngle( xAxis, 55 * MathUtils.DEG2RAD );
	lightPosition2.applyAxisAngle( up, ( 15 - 90 ) * MathUtils.DEG2RAD );

	lightPosition3.copy( up );
	lightPosition3.applyAxisAngle( xAxis, 55 * MathUtils.DEG2RAD );
	lightPosition3.applyAxisAngle( up, ( 75 - 90 ) * MathUtils.DEG2RAD );

	directionalLight0.position.copy( lightPosition0 );
	directionalLight1.position.copy( lightPosition1 );
	directionalLight2.position.copy( lightPosition2 );
	directionalLight3.position.copy( lightPosition3 );

	const lights = new Group();

	lights.addStatic( directionalLight0 );
	lights.addStatic( directionalLight1 );
	lights.addStatic( directionalLight2 );
	lights.addStatic( directionalLight3 );

	scene.addStatic( lights );

	scene.addStatic( ambientLight );

	this.mode = LM_SINGLE;

	this.setRotation = function( rotation ) {

		lights.setRotationFromAxisAngle( up, rotation.z );
		lights.updateMatrix();

	};

	Object.defineProperty( this, 'directionalLighting', {
		get() { return directionalLight0.visible; },
		set( on ) {

			directionalLight0.visible = ( on && this.mode == LM_SINGLE );
			directionalLight1.visible = ( on && this.mode == LM_MULTIPLE );
			directionalLight2.visible = ( on && this.mode == LM_MULTIPLE );
			directionalLight3.visible = ( on && this.mode == LM_MULTIPLE );
			ambientLight.intensity = ( this.mode == LM_SINGLE) ? ( on ? 0.3 : 1.0 ) : 0.0;

		}
	} );

}

export { LightingManager };