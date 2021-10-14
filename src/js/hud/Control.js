class Control {

	constructor ( container, width, height, onEnter ) {

		this.hitRegion = this.createHitRegion( width, height, onEnter );
		this.container = container;

	}

	createHitRegion ( width, height, onEnter ) {

		const div = document.createElement( 'div' );

		div.style.width = width + 'px';
		div.style.height = height + 'px';
		div.style.position = 'absolute';

		div.setAttribute( 'draggable', 'false' );
		div.addEventListener( 'dragstart', e => e.preventDefault() );

		div.addEventListener( 'pointerenter', onEnter );

		return div;

	}

	positionHitRegion ( right, bottom ) {

		const hr = this.hitRegion;

		hr.style.right = right + 'px';
		hr.style.bottom = bottom + 'px';

		this.container.appendChild( hr );

	}

	commonEnter ( target, handlers ) {

		for ( const event in handlers ) {

			target.addEventListener( event, handlers[ event ] );

		}

		this.rect = this.hitRegion.getBoundingClientRect();
		this.hitRegion.style.cursor = 'pointer';

	}

	commonLeave ( target, handlers ) {

		for ( const event in handlers ) {

			target.removeEventListener( event, handlers[ event ] );

		}

		this.hitRegion.style.cursor = 'default';

	}

	dispose () {

		const hr = this.hitRegion;
		hr.parentNode.removeChild( hr );

	}

}

export { Control };