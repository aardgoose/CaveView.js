import { ShaderChunk } from '../../Three';

import anaglyphVertexShader from './anaglyphVertexShader.glsl';
import anaglyphFragmentShader from './anaglyphFragmentShader.glsl';

import depthMapVertexShader from './depthMapVertexShader.glsl';
import depthMapFragmentShader from './depthMapFragmentShader.glsl';

import glyphVertexShader from './glyphVertexShader.glsl';
import glyphFragmentShader from './glyphFragmentShader.glsl';

import popupVertexShader from './popupVertexShader.glsl';
import popupFragmentShader from './popupFragmentShader.glsl';

import waterVertexShader from './waterVertexShader.glsl';
import waterFragmentShader from './waterFragmentShader.glsl';

import lineVertexShader from './lineVertexShader.glsl';
import lineFragmentShader from './lineFragmentShader.glsl';

// shader chunks to be included

import location_fade_fragment_pars from './chunks/location_fade_fragment_pars.glsl';
import location_fade_fragment from './chunks/location_fade_fragment.glsl';

import packRGBA from './chunks/packRGBA.glsl';

Object.assign( ShaderChunk, {
	// common terrain location indicator

	location_fade_fragment_pars: location_fade_fragment_pars,
	location_fade_fragment: location_fade_fragment,

	packRGBA: packRGBA
} );

export const Shaders = {
	anaglyphVertexShader:	anaglyphVertexShader,
	anaglyphFragmentShader:	anaglyphFragmentShader,
	depthMapVertexShader:	depthMapVertexShader,
	depthMapFragmentShader:	depthMapFragmentShader,
	glyphVertexShader:		glyphVertexShader,
	glyphFragmentShader:	glyphFragmentShader,
	popupVertexShader:		popupVertexShader,
	popupFragmentShader:	popupFragmentShader,
	waterVertexShader:		waterVertexShader,
	waterFragmentShader:	waterFragmentShader,
	lineVertexShader:		lineVertexShader,
	lineFragmentShader:		lineFragmentShader,
};

// EOF