import {
  Building2,
  Cloud,
  Compass,
  Lightbulb,
  MapPin,
  Plane,
  Route,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';
import type { SuggestionItem } from './chat';

export const TOOL_NAMES = {
  WEATHER: 'weatherTool',
  FLIGHTS: 'flightsTool',
  HOTEL: 'hotelTool',
  LOCAL_TIPS: 'localTipsTool',
  PLACES: 'placesTool',
  ROUTE: 'routeTool',
  TRIP_SUMMARY: 'tripSummaryTool',
  DESTINATION_EXPLORER: 'destinationExplorerTool',
  BOOK_FLIGHT: 'bookFlightTool',
  BOOK_HOTEL: 'bookHotelTool',
  CANCEL_BOOKING: 'cancelBookingTool',
} as const;

export const TOOL_SUGGESTION_ITEMS: Readonly<Partial<Record<string, readonly SuggestionItem[]>>> = {
  [TOOL_NAMES.FLIGHTS]: [
    {
      icon: Building2,
      title: 'Find hotels',
      description: 'Search hotels at your destination',
      message: 'Show hotels',
    },
    {
      icon: Cloud,
      title: 'Weather forecast',
      description: 'Check the forecast for your trip',
      message: 'Check the weather',
    },
    {
      icon: Compass,
      title: 'Plan my trip',
      description: 'Build a full itinerary',
      message: 'Plan a trip',
    },
  ],
  [TOOL_NAMES.HOTEL]: [
    {
      icon: Lightbulb,
      title: 'Insider tips',
      description: 'Safety, money, transport & local know-how',
      message: 'Get local tips',
    },
    {
      icon: MapPin,
      title: 'Places nearby',
      description: 'Top attractions around your hotel',
      message: 'Find places nearby',
    },
    {
      icon: Cloud,
      title: 'Weather forecast',
      description: 'Check the forecast for your trip',
      message: 'Check the weather',
    },
  ],
  [TOOL_NAMES.WEATHER]: [
    {
      icon: MapPin,
      title: 'Top places',
      description: 'Best-rated spots to visit',
      message: 'Find places to visit',
    },
    {
      icon: Building2,
      title: 'Find hotels',
      description: 'Search hotels at your destination',
      message: 'Show hotels',
    },
  ],
  [TOOL_NAMES.PLACES]: [
    {
      icon: Route,
      title: 'Build a route',
      description: 'Turn these into a walking tour',
      message: 'Build a walking tour',
    },
    {
      icon: UtensilsCrossed,
      title: 'Where to eat',
      description: 'Find restaurants nearby',
      message: 'Find restaurants nearby',
    },
    {
      icon: Zap,
      title: 'Things to do',
      description: 'Explore activities & experiences',
      message: 'Show activities',
    },
  ],
  [TOOL_NAMES.ROUTE]: [
    {
      icon: UtensilsCrossed,
      title: 'Where to eat',
      description: 'Find restaurants along the route',
      message: 'Find restaurants nearby',
    },
    {
      icon: Lightbulb,
      title: 'Insider tips',
      description: 'Safety, money, transport & local know-how',
      message: 'Get local tips',
    },
  ],
  [TOOL_NAMES.LOCAL_TIPS]: [
    {
      icon: MapPin,
      title: 'Top places',
      description: 'Best-rated spots to visit',
      message: 'Find places to visit',
    },
    {
      icon: Plane,
      title: 'Search flights',
      description: 'Find flights to your destination',
      message: 'Search for flights',
    },
  ],
  [TOOL_NAMES.TRIP_SUMMARY]: [
    {
      icon: Cloud,
      title: 'Weather forecast',
      description: 'Check the forecast for your trip dates',
      message: 'Check the weather',
    },
    {
      icon: MapPin,
      title: 'Top places',
      description: 'Best-rated spots to visit',
      message: 'Find places to visit',
    },
    {
      icon: Lightbulb,
      title: 'Insider tips',
      description: 'Safety, money, transport & local know-how',
      message: 'Get local tips',
    },
  ],
  [TOOL_NAMES.DESTINATION_EXPLORER]: [
    {
      icon: Plane,
      title: 'Search flights',
      description: 'Find flights to this destination',
      message: 'Search for flights',
    },
    {
      icon: Building2,
      title: 'Find hotels',
      description: 'Search hotels at your destination',
      message: 'Show hotels',
    },
    {
      icon: Compass,
      title: 'Plan my trip',
      description: 'Build a full itinerary with flight & hotel',
      message: 'Plan a trip',
    },
  ],
};

export const TOOL_STATUS = {
  IN_PROGRESS: 'inProgress',
  EXECUTING: 'executing',
  COMPLETE: 'complete',
} as const;

// CopilotKit action names — human-in-the-loop, gates, and booked-item display
export const ACTIONS = {
  CHANGE_THEME: 'changeTheme',
  CONFIRM_LOCAL_TIPS: 'confirmLocalTips',
  CONFIRM_PLACES_SEARCH: 'confirmPlacesSearch',
  CONFIRM_ROUTE_SEARCH: 'confirmRouteSearch',
  CONFIRM_TRIP_SUMMARY: 'confirmTripSummary',
  SHOW_BOOKED_FLIGHTS: 'show-booked-flights',
  SHOW_BOOKED_HOTEL: 'show-booked-hotel',
  GET_FLIGHT_INFO: 'get-flight-info',
  GET_HOTEL_INFO: 'get-hotel-info',
} as const;
