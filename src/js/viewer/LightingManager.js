import {
	Spherical, Vector3,
	Object3D,
	AmbientLight,
	DirectionalLight
} from '../Three';

import { Cfg } from '../core/lib';

function LightingManager ( scene ) {

	const lightPosition = new Vector3();
	const currentLightPosition = new Vector3();
	const directionalLight = new DirectionalLight( 0xffffff );
	const ambientLight = new AmbientLight( 0xffffff, 0.3 );

	const inclination = Cfg.themeAngle( 'lighting.inclination' );
	const azimuth = Cfg.themeAngle( 'lighting.azimuth' ) - Math.PI / 2;

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
		writeable: true,
		get: function () { return directionalLight.visible; },
		set: function ( on ) {

			directionalLight.visible = on;
			ambientLight.intensity = on ? 0.3 : 1.0;

		}
	} );

}


export { LightingManager };