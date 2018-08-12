
import { upAxis } from '../core/constants';
import { Cfg } from '../core/lib';
import { HudObject } from './HudObject';
import { Viewer } from '../viewer/Viewer';
import { MutableGlyphString } from '../core/GlyphString';
import { Materials } from '../materials/Materials';

import {
	RingBufferGeometry,
	MeshBasicMaterial,
	VertexColors,
	Mesh, Float32BufferAttribute,
} from '../Three';

function onUploadDropBuffer() {

	// call back from BufferAttribute to drop JS buffers after data has been transfered to GPU
	this.array = null;

}

function ProgressDial ( addText, ring ) {

	const stdWidth  = HudObject.stdWidth;
	const stdMargin = HudObject.stdMargin;

	const offset = stdWidth + stdMargin;

	const gap = ring === 0 ? 0 : 1;
	const segments = 50;
	const geometry = new RingBufferGeometry( stdWidth * ( 0.9 - ring * 0.1 ), stdWidth * ( 1 - ring * 0.1 ) - gap, segments );

	const colorCount = 2 * ( segments + 1);

	const backgroundColor = Cfg.themeColor( 'hud.progressBackground' );
	const setColor = Cfg.themeColor( 'hud.progress' );

	const colorsSrc = [];

	for ( var i = 0; i < colorCount; i++ ) colorsSrc.push( backgroundColor );

	const colors = new Float32BufferAttribute( colorCount * 3, 3 );

	geometry.addAttribute( 'color', colors );

	geometry.getAttribute( 'position' ).onUpload( onUploadDropBuffer );
	geometry.getAttribute( 'normal' ).onUpload( onUploadDropBuffer );
	geometry.getAttribute( 'uv' ).onUpload( onUploadDropBuffer );

	this.colorsSrc = colorsSrc;
	this.backgroundColor = backgroundColor;
	this.setColor = setColor;

	Mesh.call( this, geometry, new MeshBasicMaterial( { color: 0xffffff, vertexColors: VertexColors } ) );

	this.name = 'CV.ProgressDial';

	this.translateX( -offset * 5 );
	this.translateY(  offset );

	this.rotateOnAxis( upAxis, Math.PI / 2 );

	this.visible = false;
	this.isVisible = true;

	this.color = Cfg.themeValue( 'hud.progress' );

	if ( addText ) {

		var glyphMaterial = Materials.getGlyphMaterial( HudObject.atlasSpec, 0 );

		const pcent = new MutableGlyphString( '----', glyphMaterial );

		pcent.translateY( pcent.getWidth() / 2 );
		pcent.translateX( -10 );

		this.add( pcent );
		this.pcent = pcent;

	} else {

		this.pcent = null;

	}

	return this;

}

ProgressDial.prototype = Object.create( Mesh.prototype );

ProgressDial.prototype.colorRange = function ( range, color ) {

	const colors = this.geometry.getAttribute( 'color' );
	const colorsSrc = this.colorsSrc;

	const segmentMax = Math.round( range / 2 );
	const end = colorsSrc.length - 1;

	for ( var i = 0; i < segmentMax + 1; i++ ) {

		colorsSrc[ end - i ] = color;
		colorsSrc[ end - i - 50 ] = color;

	}

	colors.copyColorsArray( colorsSrc );
	colors.needsUpdate = true;

};

ProgressDial.prototype.set = function ( progress ) {

	if ( progress === this.progress ) return;

	this.progress = progress;

	const l = Math.floor( Math.min( 100, Math.round( progress ) ) / 2 ) * 2;
	const pcent = this.pcent;

	this.colorRange( l, this.setColor );

	if ( pcent !== null ) {

		var pcentValue = Math.round( progress ) + '%';

		pcent.replaceString( pcentValue.padStart( 4, ' ' ) );
		pcent.translateY( pcent.getWidth() / 2 - pcent.position.y );

	}

	Viewer.renderView();

};

ProgressDial.prototype.addValue = function ( progress ) {

	this.set( this.progress + progress );

};

ProgressDial.prototype.start = function () {

	this.colorRange( 100, this.backgroundColor );

	this.progress = 0;
	this.visible = true;

	if ( this.pcent !== null ) this.pcent.replaceString( '  0%' );

	Viewer.renderView();

};

ProgressDial.prototype.end = function () {

	const self = this;

	setTimeout( function () { self.visible = false; Viewer.renderView(); }, 500 );

};

ProgressDial.prototype.setVisibility = function ( visibility ) {

	this.isVisible = visibility;
	this.visible = ( this.visible && visibility );

};

ProgressDial.prototype.watch = function ( obj ) {

	const self = this;
	obj.addEventListener( 'progress', self.handleProgess.bind( self ) );

};

ProgressDial.prototype.handleProgess = function ( event ) {

	switch ( event.name ) {

	case 'start':

		this.start();
		break;

	case 'set':

		this.set( event.progress );
		break;

	case 'add':

		this.addValue( event.value );
		break;

	case 'end':

		this.end();
		break;

	}

};

export { ProgressDial };

// EOF