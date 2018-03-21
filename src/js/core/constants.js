
import { Vector3 }  from '../../../../three.js/src/math/Vector3';

export const VERSION = '1.7.0';

export const MATERIAL_LINE       = 1;
export const MATERIAL_SURFACE    = 2;

export const CAMERA_ORTHOGRAPHIC = 1;
export const CAMERA_PERSPECTIVE  = 2;
export const CAMERA_OFFSET       = 600;

// preset camera views

export const VIEW_NONE           = 0;
export const VIEW_PLAN           = 1;
export const VIEW_ELEVATION_N    = 2;
export const VIEW_ELEVATION_S    = 3;
export const VIEW_ELEVATION_E    = 4;
export const VIEW_ELEVATION_W    = 5;

// mouse selection operation mode

export const MOUSE_MODE_NORMAL     = 0;
export const MOUSE_MODE_ROUTE_EDIT = 1;
export const MOUSE_MODE_DISTANCE   = 2;
// shading types

export const SHADING_HEIGHT       = 1;
export const SHADING_LENGTH       = 2;
export const SHADING_INCLINATION  = 3;
export const SHADING_CURSOR       = 4;
export const SHADING_SINGLE       = 5;
export const SHADING_SURVEY       = 6;
export const SHADING_OVERLAY      = 7;
export const SHADING_SHADED       = 8;
export const SHADING_DEPTH        = 9;
export const SHADING_PATH         = 10;
export const SHADING_DEPTH_CURSOR = 11;
export const SHADING_DISTANCE     = 13;

// layer tags for scene objects

export const LEG_CAVE              = 1;
export const LEG_SPLAY             = 2;
export const LEG_SURFACE           = 3;
export const FEATURE_BOX           = 4;
export const FEATURE_SELECTED_BOX  = 5;
export const FEATURE_ENTRANCES     = 6;
export const FEATURE_TERRAIN       = 7;
export const FEATURE_STATIONS      = 8;
export const FEATURE_TRACES        = 9;

export const FACE_WALLS            = 10;
export const FACE_SCRAPS           = 11;

export const WALL_OVAL             = 1; // based on Therion .lox types
export const WALL_SQUARE           = 2;
export const WALL_DIAMOND          = 3;

export const LABEL_STATION         = 12;

// flags in legs exported by Cave models

export const NORMAL  = 0;
export const SURFACE = 1;
export const SPLAY   = 2;
export const DIVING  = 3;

export const STATION_NORMAL = 0;
export const STATION_ENTRANCE = 1;

export const upAxis = new Vector3( 0, 0, 1 );

// EOF