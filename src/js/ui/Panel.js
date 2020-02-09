
import { Page } from './Page';


function Panel ( page ) {

	this.page = page;
	this.elements = [];

	this.dynamic = [];

	this.onShow = function () {

		this.dynamic.forEach ( function _deleteDynamic( element ) {

			element.parentElement.removeChild( element );

		} );

		this.dynamic = [];

	};

}

Panel.prototype.add = function ( element ) {

	this.elements.push( element );

	return element;

};

Panel.prototype.addDynamic = function ( element ) {

	this.dynamic.push ( element );

	return element;

};

Panel.prototype.setVisibility = function ( visible ) {

	const frame = this.page.frame;

	frame.setControlsVisibility( this.elements, visible );
	frame.setControlsVisibility( this.dynamic, visible );

	if ( visible && this.onShow !== null ) this.onShow();

};

export { Panel };

// EOF