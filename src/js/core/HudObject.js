"use strict";

var CV = CV || {};

CV.HudObject = function () {};

CV.HudObject.stdWidth  = 40;
CV.HudObject.stdMargin = 5;

CV.HudObject.prototype.removeDomObjects = function () {

	var obj;

	for ( var i = 0, l = this.domObjects.length; i < l; i++ ) {

		obj = this.domObjects[ i ];

		obj.parentElement.removeChild( obj );

	}

	this.domObjects = [];

}

CV.HudObject.prototype.setVisibility = function ( visible ) {

	var style;

	this.visible = visible;

	if ( visible ) {

		style = "block";

	} else {

		style = "none";

	}

	for ( var i = 0, l = this.domObjects.length; i < l; i++ ) {

		this.domObjects[ i ].style.display = style;

	}

}

// EOF