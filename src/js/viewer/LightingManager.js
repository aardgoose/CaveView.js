import { Spherical, Vector3, Object3D, AmbientLight, DirectionalLight } from '../Three';

function LightingManager ( ctx, scene ) {

	const cfg = ctx.cfg;
	const lightPosition = new Vector3();
	const currentLightPosition = new Vector3();
	const directionalLight = new DirectionalLight( 0xffffff );
	const ambientLight = new AmbientLight( 0xffffff, 0.3 );

	const inclination = cfg.themeAngle( 'lighting.inclination' );
	const azimuth = cfg.themeAngle( 'lighting.azimuth' ) - Math.PI / 2;

	lightPosition.setFromSpherical( new Spherical( 1, inclination, azimuth ) );
	lightPosition.applyAxisAngle( new Vector3( 1, 0, 0 ), Math.PI / 2 );

	currentLightPosition.copy( lightPosition );

	directionalLight.position.copy( lightPosition );

	scene.addStatic( directionalLight );
	scene.addStatic( ambientLight );

	this.setRotation = function( rotation ) {

		currentLightPosition.copy( lightPosition );
		currentLightPosition.applyAxisAngle( Object3D.DefaultUp, rotation.z );

		directionalLight.position.copy( currentLightPosition );
		directionalLight.updateMatrix();

	};

	Object.defineProperty( this, 'directionalLighting', {
		get() { return directionalLight.visible; },
		set( on ) {

			directionalLight.visible = on;
			ambientLight.intensity = on ? 0.3 : 1.0;

		}
	} );

}

export { LightingManager };