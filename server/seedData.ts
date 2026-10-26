import { Product, StructuredKnowledge, Advertisement, QuestionLog, RobotTelemetry } from '../src/types.ts';

// Completely fresh initial state: Starts strictly from ZERO
export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_KNOWLEDGE: Record<string, StructuredKnowledge> = {};

export const INITIAL_ADVERTISEMENTS: Advertisement[] = [];

export const INITIAL_QUESTION_LOGS: QuestionLog[] = [];

export const INITIAL_ROBOT_TELEMETRY: RobotTelemetry = {
  id: 'robot-ind-01',
  name: 'RoboAd India Kiosk unit #01',
  battery_level: 95,
  status: 'idle',
  current_ad_id: null,
  active_listeners: 0,
  screen_brightness: 90,
  volume: 85,
  mic_enabled: true,
  speech_synthesis_enabled: true,
  last_ping: new Date().toISOString(),
};
