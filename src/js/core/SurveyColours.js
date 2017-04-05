

import { ColourCache } from './ColourCache';

var map = [];
var selectedSection = 0;

var SurveyColours = {};

SurveyColours.clearMap = function () {

	map = [];

};

SurveyColours.getSurveyColour = function ( surveyId ) {

	var surveyColours = ColourCache.survey;

	return surveyColours[ surveyId % surveyColours.length ];

};

SurveyColours.getSurveyColourMap = function ( surveyTree, newSelectedSection ) {

	if ( selectedSection === newSelectedSection && map.length > 0 ) {

		// use cached mapping
		return map;

	}

	map = [];
	selectedSection = newSelectedSection;

	var survey = ( selectedSection !== 0 ) ? selectedSection : surveyTree.id;

	// create mapping of survey id to colour
	// map each child id _and_ all its lower level survey ids to the same colour

	var subTree = surveyTree.findById( survey );

	var colour = this.getSurveyColour( survey );

	_addMapping( subTree );

	var children = subTree.children;

	for ( var i = 0, l = children.length; i < l; i++ ) {

		var childId = children[ i ].id;

		subTree = surveyTree.findById( childId );

		colour = this.getSurveyColour( childId );

		subTree.traverse( _addMapping );

	}

	return map;

	function _addMapping ( node ) {

		map[ node.id ] = colour;

	}

};

export { SurveyColours };