export * from './weather';
export * from './flights';
export * from './hotel';
export * from './route';
export * from './places';
export * from './tips';

import { weatherTool } from './weather';
import { flightsTool } from './flights';
import { hotelTool } from './hotel';
import { routeTool } from './route';
import { placesTool } from './places';
import { tipsTool } from './tips';

export const tools = [weatherTool, flightsTool, hotelTool, routeTool, placesTool, tipsTool];
