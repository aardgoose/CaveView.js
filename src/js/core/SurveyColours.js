

import { ColourCache } from './ColourCache';

var map = [];
var selectedSection = 0;

const SurveyColours = {};

SurveyColours.clearMap = function () {

	map = [];
	selectedSection = 0;

};

SurveyColours.getSurveyColour = function ( surveyId ) {

	const surveyColours = ColourCache.getColors( 'survey' );

	return surveyColours[ surveyId % surveyColours.length ];

};

SurveyColours.getSurveyColourMap = function ( newSelectedSection ) {

	if ( selectedSection === newSelectedSection && map.length > 0 ) {

		// use cached mapping
		return map;

	}

	map = [];
	selectedSection = newSelectedSection;

	// create mapping of survey id to colour
	// map each child id _and_ all its lower level survey ids to the same colour

	var subTree = selectedSection;

	var colour = this.getSurveyColour( selectedSection.id );

	_addMapping( subTree );

	var children = subTree.children;

	while ( children.length === 1 ) {

		subTree = children[ 0 ];
		_addMapping( subTree );
		children = subTree.children;

	}

	for ( var i = 0, l = children.length; i < l; i++ ) {

		const node = children[ i ];

		colour = this.getSurveyColour( node.id );

		node.traverse( _addMapping );

	}

	return map;

	function _addMapping ( node ) {

		// only add values for sections - not stations
		if ( node.p === undefined ) map[ node.id ] = colour;

	}

};
export { SurveyColours };