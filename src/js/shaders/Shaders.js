import { ShaderChunk } from '../Three';

import anaglyphVertexShader from './anaglyphVertexShader.glsl';
import anaglyphFragmentShader from './anaglyphFragmentShader.glsl';

import cursorVertexShader from './cursorVertexShader.glsl';
import cursorFragmentShader from './cursorFragmentShader.glsl';

import depthMapVertexShader from './depthMapVertexShader.glsl';
import depthMapFragmentShader from './depthMapFragmentShader.glsl';

import depthVertexShader from './depthVertexShader.glsl';
import depthFragmentShader from './depthFragmentShader.glsl';

import depthCursorVertexShader from './depthCursorVertexShader.glsl';
import depthCursorFragmentShader from './cursorFragmentShader.glsl';

import glyphVertexShader from './glyphVertexShader.glsl';
import glyphFragmentShader from './glyphFragmentShader.glsl';

import heightVertexShader from './heightVertexShader.glsl';
import heightFragmentShader from './heightFragmentShader.glsl';

import popupVertexShader from './popupVertexShader.glsl';
import popupFragmentShader from './popupFragmentShader.glsl';

import waterVertexShader from './waterVertexShader.glsl';
import waterFragmentShader from './waterFragmentShader.glsl';

import lineVertexShader from './lineVertexShader.glsl';
import lineFragmentShader from './lineFragmentShader.glsl';

import zVertexShader from './zVertexShader.glsl';
import zFragmentShader from './zFragmentShader.glsl';

// shader chunks to be included

import wall_vertex from './chunks/wall_vertex.glsl';
import wall_vertex_pars from './chunks/wall_vertex_pars.glsl';
import wall_fragment_pars from './chunks/wall_fragment_pars.glsl';

import depth_vertex_pars from './chunks/depth_vertex_pars.glsl';
import depth_vertex from './chunks/depth_vertex.glsl';

import cursor_fragment from './chunks/cursor_fragment.glsl';
import cursor_fragment_pars from './chunks/cursor_fragment_pars.glsl';

Object.assign( ShaderChunk, {
	// common wall shader code
	wall_vertex: wall_vertex,
	wall_vertex_pars: wall_vertex_pars,
	wall_fragment_pars: wall_fragment_pars,

	// common depth below surface shader code
	depth_vertex_pars: depth_vertex_pars,
	depth_vertex: depth_vertex,

	// common cursor shader code
	cursor_fragment: cursor_fragment,
	cursor_fragment_pars: cursor_fragment_pars
} );

export const Shaders = {
	anaglyphVertexShader:	anaglyphVertexShader,
	anaglyphFragmentShader:	anaglyphFragmentShader,
	cursorVertexShader:		cursorVertexShader,
	cursorFragmentShader:	cursorFragmentShader,
	depthMapVertexShader:	depthMapVertexShader,
	depthMapFragmentShader:	depthMapFragmentShader,
	depthVertexShader:		depthVertexShader,
	depthFragmentShader:	depthFragmentShader,
	depthCursorVertexShader:		depthCursorVertexShader,
	depthCursorFragmentShader:		depthCursorFragmentShader,
	glyphVertexShader:		glyphVertexShader,
	glyphFragmentShader:	glyphFragmentShader,
	heightVertexShader:		heightVertexShader,
	heightFragmentShader:	heightFragmentShader,
	popupVertexShader:		popupVertexShader,
	popupFragmentShader:	popupFragmentShader,
	waterVertexShader:		waterVertexShader,
	waterFragmentShader:	waterFragmentShader,
	lineVertexShader:		lineVertexShader,
	lineFragmentShader:		lineFragmentShader,
	zVertexShader:			zVertexShader,
	zFragmentShader:		zFragmentShader
};

// EOF