import { PointsMaterial, CanvasTexture } from '../Three';

function ClusterMaterial ( count ) {

	const markerSize = 64;
	const fontSize = 40;
	const halfSize = markerSize / 2;

	const canvas = document.createElement( 'canvas' );

	if ( ! canvas ) console.error( 'creating canvas for glyph atlas failed' );

	canvas.width  = markerSize;
	canvas.height = markerSize;

	const ctx = canvas.getContext( '2d' );

	if ( ! ctx ) console.error( 'cannot obtain 2D canvas' );

	// set transparent background

	ctx.fillStyle = 'rgba( 0, 0, 0, 0 )';
	ctx.fillRect( 0, 0, markerSize, markerSize );

	ctx.textAlign = 'center';
	ctx.font = 'bold ' + fontSize + 'px helvetica,sans-serif';
	ctx.fillStyle = '#ffffff';

	const gradient = ctx.createRadialGradient( halfSize, halfSize, 30, halfSize, halfSize, 0 );

	gradient.addColorStop( 0.0, 'rgba( 255, 128, 0, 64 )' );
	gradient.addColorStop( 0.3, 'rgba( 255, 200, 0, 255 )' );
	gradient.addColorStop( 1.0, 'rgba( 255, 255, 0, 255 )' );

	ctx.fillStyle = gradient;

	ctx.beginPath();
	ctx.arc( halfSize, halfSize, 30, 0, Math.PI * 2 );
	ctx.fill();

	ctx.fillStyle = 'rgba( 0, 0, 0, 255 )';

	ctx.fillText( count, halfSize, halfSize + 15 );

	PointsMaterial.call( this, { map: new CanvasTexture( canvas ), size: 32, depthTest: false, transparent: true, alphaTest: 0.8, sizeAttenuation: false } );

	this.name = 'ClusterMaterial';

	return this;

}

ClusterMaterial.prototype = Object.create( PointsMaterial.prototype );

ClusterMaterial.prototype.constructor = ClusterMaterial;

export { ClusterMaterial };