/**
 * Centralized Groq Free/Developer Tier Model Configuration
 * 
 * IMPORTANT:
 * This list contains ONLY verified models currently available under Groq's
 * free/developer usage tier.
 * 
 * To change or update models if Groq adjusts availability, simply update
 * this centralized list or configure the GROQ_MODEL environment variable.
 */

export const FREE_GROQ_MODELS = [
  'llama-3.3-70b-versatile', // Flagship high-intelligence 70B model
  'llama-3.1-8b-instant',    // Ultra-fast lightweight 8B model
  'gemma2-9b-it',            // Google Gemma 2 9B instruction-tuned
  'mixtral-8x7b-32768',      // Mixtral 8x7B high-context model
  'llama3-70b-8192',         // Llama 3 70B
  'llama3-8b-8192',          // Llama 3 8B
] as const;

export type FreeGroqModel = typeof FREE_GROQ_MODELS[number];

export const DEFAULT_FREE_GROQ_MODEL: FreeGroqModel = 'llama-3.3-70b-versatile';

/**
 * Validates and selects the available free Groq model.
 * 
 * Architecture:
 * Reads GROQ_MODEL from environment -> Checks if it is in FREE_GROQ_MODELS list.
 * If valid -> Uses it.
 * If invalid or absent -> Safely falls back to DEFAULT_FREE_GROQ_MODEL.
 * Never switches to paid or unapproved external models.
 */
export function getAvailableFreeGroqModel(): string {
  const envModel = process.env.GROQ_MODEL?.trim();

  if (envModel) {
    const isApproved = (FREE_GROQ_MODELS as readonly string[]).includes(envModel);
    if (isApproved) {
      return envModel;
    }
    console.warn(
      `[Groq Free Model Selector] Configured GROQ_MODEL '${envModel}' is not in the approved free-tier model list. Safely defaulting to approved free model: '${DEFAULT_FREE_GROQ_MODEL}'.`
    );
  }

  return DEFAULT_FREE_GROQ_MODEL;
}

export default FREE_GROQ_MODELS;
