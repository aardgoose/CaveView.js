"use strict";

var CV = CV || {};

CV.ProgressDial = function ( container ) {

	var stdWidth  = CV.HudObject.stdWidth;
	var stdMargin = CV.HudObject.stdMargin;

	var geometry = new THREE.RingGeometry( stdWidth * 0.9, stdWidth, 50 );

	THREE.Mesh.call( this, geometry, new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } ) );

	this.name = "CV.ProgressDial";
	this.domObjects = [];

	var offset = stdWidth + stdMargin;

	this.translateX( -offset * 5 );
	this.translateY(  offset );

	this.rotateOnAxis( CV.upAxis, Math.PI / 2 );

	this.visible  = false;
	this.isVisible = true;

	this.addEventListener( "removed", this.removeDomObjects );

	return this;

}

CV.ProgressDial.prototype = Object.create( THREE.Mesh.prototype );

Object.assign( CV.ProgressDial.prototype, CV.HudObject.prototype );

CV.ProgressDial.prototype.contructor = CV.ProgressDial;

CV.ProgressDial.prototype.set = function ( progress ) {

	this.progress = progress;

	var l = Math.floor( Math.min( 100, Math.round( progress ) ) / 2 ) * 2;
	var faces = this.geometry.faces;

	for ( var i = 0; i < l; i++ ) {

		faces[ 99 - i ].color.set( 0x00ff00 );

	}

	this.geometry.colorsNeedUpdate = true;

}

CV.ProgressDial.prototype.add = function ( progress ) {

	this.set( this.progress + progress );

}

CV.ProgressDial.prototype.start = function () {

	var faces = this.geometry.faces;

	for ( var i = 0; i < 100; i++ ) {

		faces[i].color.set( 0x333333 );

	}

	this.geometry.colorsNeedUpdate = true;
	this.progress = 0;
	this.visible = this.isVisible;

}

CV.ProgressDial.prototype.end = function () {

	var self = this;

	setTimeout( function () { self.visible = false; }, 500 );

}

CV.ProgressDial.prototype.setVisibility = function ( visibility ) {

	this.isVisible = visibility;
	this.visible = ( this.visible && visibility );

}

// EOF