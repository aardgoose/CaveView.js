class Panel {

	constructor ( page ) {

		this.page = page;
		this.elements = [];
		this.dynamic = [];

		this.onShow = function () {

			this.dynamic.forEach( element => element.parentElement.removeChild( element ) );
			this.dynamic = [];

		};

	}

	add ( element ) {

		this.elements.push( element );

		return element;

	}

	addDynamic ( element ) {

		this.dynamic.push( element );

		return element;

	}

	setVisibility ( visible ) {

		const frame = this.page.frame;

		frame.setControlsVisibility( this.elements, visible );
		frame.setControlsVisibility( this.dynamic, visible );

		if ( visible && this.onShow !== null ) this.onShow();

	}

}

export { Panel };