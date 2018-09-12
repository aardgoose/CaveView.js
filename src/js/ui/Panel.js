
import { Page } from './Page';


function Panel ( page ) {

	this.page = page;
	this.elements = [];
	this.onShow = null;

}

Panel.prototype.add = function ( element ) {

	this.elements.push( element );

	return element;

};

Panel.prototype.setVisibility = function ( visible ) {

	Page.setControlsVisibility( this.elements, visible );

	if ( visible && this.onShow !== null ) this.onShow();

};

export { Panel };

// EOF