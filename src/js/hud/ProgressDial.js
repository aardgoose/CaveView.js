import { MutableGlyphString } from '../core/GlyphString';

import { RingBufferGeometry, Object3D, Mesh, Float32BufferAttribute } from '../Three';

class ProgressDial extends Mesh {

	constructor ( hudObject, addText, ring, viewer ) {

		const cfg = hudObject.ctx.cfg;
		const materials = hudObject.ctx.materials;
		const stdWidth  = hudObject.stdWidth;
		const stdMargin = hudObject.stdMargin;

		const offset = stdWidth + stdMargin;

		const gap = ring === 0 ? 0 : 1;
		const segments = 50;
		const geometry = new RingBufferGeometry( stdWidth * ( 0.9 - ring * 0.1 ), stdWidth * ( 1 - ring * 0.1 ) - gap, segments );

		const colors = new Float32BufferAttribute( ( segments + 1) * 6, 3 );

		geometry.setAttribute( 'color', colors );

		super( geometry, materials.getPlainMaterial() );

		this.backgroundColor = cfg.themeColor( 'hud.progressBackground' );
		this.setColor = cfg.themeColor( 'hud.progress' );
		this.viewer = viewer;


		this.dropBuffers( false );

		this.name = 'CV.ProgressDial';

		this.translateX( -offset * 5 );
		this.translateY(  offset );

		this.rotateOnAxis( Object3D.DefaultUp, Math.PI / 2 );

		this.visible = false;
		this.isVisible = true;

		this.colorRange( 0 );

		if ( addText ) {

			var glyphMaterial = materials.getGlyphMaterial( hudObject.atlasSpec, 0 );

			const pcent = new MutableGlyphString( '----', glyphMaterial );

			pcent.translateY( pcent.getWidth() / 2 );
			pcent.translateX( -10 );

			this.add( pcent );
			this.pcent = pcent;

		} else {

			this.pcent = null;

		}

	}

}

ProgressDial.prototype.colorRange = function ( range ) {

	const colors = this.geometry.getAttribute( 'color' );
	const segmentMax = 50 - Math.round( range / 2 );
	const cc = colors.count;
	const c1 = this.setColor;
	const c2 = this.backgroundColor;

	for ( let i = cc / 2; i >= 0; i-- ) {

		const c =  i > segmentMax ? c1 : c2;

		c.toArray( colors.array, i * 3 );
		c.toArray( colors.array, ( i + 51 ) * 3 );

	}

	colors.needsUpdate = true;

};

ProgressDial.prototype.set = function ( progress ) {

	if ( progress === this.progress ) return;

	this.progress = progress;

	const l = Math.floor( Math.min( 100, Math.round( progress ) ) / 2 ) * 2;
	const pcent = this.pcent;

	this.colorRange( l );

	if ( pcent !== null ) {

		var pcentValue = Math.round( progress ) + '%';

		pcent.replaceString( pcentValue.padStart( 4, ' ' ) );
		pcent.translateY( pcent.getWidth() / 2 - pcent.position.y );

	}

	this.viewer.renderView();

};

ProgressDial.prototype.start = function () {

	this.colorRange( 0 );

	this.progress = 0;
	this.visible = true;

	if ( this.pcent !== null ) this.pcent.replaceString( '  0%' );

	this.viewer.renderView();

};

ProgressDial.prototype.end = function () {

	const self = this;

	setTimeout( function endProgress () { self.visible = false; self.viewer.renderView(); }, 500 );

};

ProgressDial.prototype.setVisibility = function ( visibility ) {

	this.isVisible = visibility;
	this.visible = ( this.visible && visibility );

};

ProgressDial.prototype.watch = function ( obj ) {

	obj.addEventListener( 'progress', this.handleProgess.bind( this ) );

};

ProgressDial.prototype.handleProgess = function ( event ) {

	switch ( event.name ) {

	case 'start':

		this.start();
		break;

	case 'set':

		this.set( event.progress );
		break;

	case 'end':

		this.end();
		break;

	}

};

export { ProgressDial };