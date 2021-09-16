
function SurveyColourMapper ( ctx ) {

	let map = [];
	let selectedSection = 0;

	this.getColour = function ( surveyId ) {

		const surveyColours = ctx.materials.colourCache.getColorSet( 'survey' );

		return surveyColours[ surveyId % surveyColours.length ];

	};

	this.getColourMap = function ( newSelectedSection ) {

		if ( selectedSection === newSelectedSection && map.length > 0 ) {

			// use cached mapping
			return map;

		}

		map = [];
		selectedSection = newSelectedSection;

		// create mapping of survey id to colour
		// map each child id _and_ all its lower level survey ids to the same colour

		let subTree = selectedSection;
		let colour = this.getColour( selectedSection.id );

		_addMapping( subTree );

		let children = subTree.children;

		while ( children.length === 1 ) {

			subTree = children[ 0 ];
			_addMapping( subTree );
			children = subTree.children;

		}

		for ( let i = 0, l = children.length; i < l; i++ ) {

			const node = children[ i ];

			colour = this.getColour( node.id );

			node.traverse( _addMapping );

		}

		return map;

		function _addMapping ( node ) {

			// only add values for sections - not stations
			if ( ! node.isStation() ) map[ node.id ] = colour;

		}

	};

}

export { SurveyColourMapper };