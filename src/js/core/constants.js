
import { Vector3 }  from '../../../../three.js/src/math/Vector3';

export var VERSION = '1.2.0';

export var MATERIAL_LINE       = 1;
export var MATERIAL_SURFACE    = 2;

export var CAMERA_ORTHOGRAPHIC = 1;
export var CAMERA_PERSPECTIVE  = 2;
export var CAMERA_OFFSET       = 600;

// preset camera views

export var VIEW_NONE           = 0;
export var VIEW_PLAN           = 1;
export var VIEW_ELEVATION_N    = 2;
export var VIEW_ELEVATION_S    = 3;
export var VIEW_ELEVATION_E    = 4;
export var VIEW_ELEVATION_W    = 5;

// mouse selection operation mode

export var MOUSE_MODE_NORMAL     = 0;
export var MOUSE_MODE_ROUTE_EDIT = 1;
// shading types

export var SHADING_HEIGHT       = 1;
export var SHADING_LENGTH       = 2;
export var SHADING_INCLINATION  = 3;
export var SHADING_CURSOR       = 4;
export var SHADING_SINGLE       = 5;
export var SHADING_SURVEY       = 6;
export var SHADING_OVERLAY      = 7;
export var SHADING_SHADED       = 8;
export var SHADING_DEPTH        = 9;
export var SHADING_PATH         = 10;
export var SHADING_DEPTH_CURSOR = 11;

// layer tags for scene objects

export var LEG_CAVE              = 1;
export var LEG_SPLAY             = 2;
export var LEG_SURFACE           = 3;
export var FEATURE_BOX           = 4;
export var FEATURE_SELECTED_BOX  = 5;
export var FEATURE_ENTRANCES     = 6;
export var FEATURE_TERRAIN       = 7;
export var FEATURE_STATIONS      = 8;
export var FEATURE_TRACES        = 9;

export var FACE_WALLS            = 10;
export var FACE_SCRAPS           = 11;

export var LABEL_STATION         = 12;

// flags in legs exported by Cave models

export var NORMAL  = 0;
export var SURFACE = 1;
export var SPLAY   = 2;
export var DIVING  = 3;

export var STATION_NORMAL = 0;
export var STATION_ENTRANCE = 1;

export var upAxis = new Vector3( 0, 0, 1 );

// EOF