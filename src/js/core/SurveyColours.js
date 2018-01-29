

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

SurveyColours.getSurveyColourMap = function ( surveyTree, newSelectedSection ) {

	if ( selectedSection === newSelectedSection && map.length > 0 ) {

		// use cached mapping
		return map;

	}

	map = [];
	selectedSection = newSelectedSection;

	const survey = ( selectedSection === 0 ) ? surveyTree.id : selectedSection;

	// create mapping of survey id to colour
	// map each child id _and_ all its lower level survey ids to the same colour

	var subTree = surveyTree.findById( survey );

	var colour = this.getSurveyColour( survey );

	_addMapping( subTree );

	var children = subTree.children;

	while ( children.length === 1 ) {

		subTree = children[ 0 ];
		_addMapping( subTree );
		children = subTree.children;

	}

	for ( var i = 0, l = children.length; i < l; i++ ) {

		const childId = children[ i ].id;

		subTree = surveyTree.findById( childId );

		colour = this.getSurveyColour( childId );

		subTree.traverse( _addMapping );

	}

	return map;

	function _addMapping ( node ) {

		// only add values for sections - not stations
		if ( node.p === undefined ) map[ node.id ] = colour;

	}

};

export { SurveyColours };