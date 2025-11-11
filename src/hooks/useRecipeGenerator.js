import { useState } from "react";

import { normaliseRecipes } from "../utils/normaliseRecipes";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const DEV_PROXY_URL = "/api/openai"; // Vite dev proxy path

export const useRecipeGenerator = (apiKey) => {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const generateRecipes = async (ingredients, isAlcoholic = true) => {
    const trimmedKey = apiKey.trim();
    // Always use proxy during Vite development to avoid CORS
    const useProxy = import.meta.env?.DEV === true;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      setErrorMessage("Add at least one ingredient before generating recipes.");
      return;
    }

    const drinkLabel = isAlcoholic ? "alcoholic drinks" : "non-alcoholic drinks";
    const recipeLabel = isAlcoholic ? "alcoholic drink" : "non-alcoholic drink";
    const staples = isAlcoholic
      ? "common bar staples like ice, citrus (lemon/lime/orange), sugar/simple syrup, and simple garnishes"
      : "common mocktail staples like ice, citrus (lemon/lime/orange), sugar/simple syrup, soda water/club soda, and simple garnishes";
    const restrictionLine = isAlcoholic
      ? ""
      : " Ensure every recipe is completely free of alcohol, spirits, and liqueurs.";
    const userContent = `You must only use ingredients from the user's provided list plus ${staples}. Do not introduce any other ingredients.

Available ingredients: ${ingredients.join(", ")}. The user wants ${drinkLabel}. Suggest up to 5 distinct ${recipeLabel} recipes that a home bartender can make strictly using these ingredients (you may assume access to ${staples}).${restrictionLine}

For each recipe, return a JSON object with: name (string), description (1-2 sentences), instructions (1-3 short steps), and ingredients (array of ingredient names used, without quantities). Ensure the ingredients array is a subset of the provided ingredients plus the allowed staples. Return a single JSON object shaped exactly as {"recipes":[{...}]}.`;

    setIsLoading(true);
    setErrorMessage("");
    setRecipes([]);

    try {
      const endpoint = useProxy ? DEV_PROXY_URL : OPENAI_CHAT_COMPLETIONS_URL;
      const headers = useProxy
        ? { "Content-Type": "application/json" }
        : { "Content-Type": "application/json", Authorization: `Bearer ${trimmedKey}` };

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "gpt-5-nano",
          temperature: 1,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are an expert mixologist who crafts cocktails and mocktails based on the user's stated preference. Keep suggestions concise and bar-ready.",
            },
            {
              role: "user",
              content: userContent,
            },
          ],
        }),
      });

      if (!response.ok) {
        let errorDetail = `OpenAI request failed (${response.status})`;
        try {
          const errorPayload = await response.json();
          if (errorPayload?.error?.message) {
            errorDetail = errorPayload.error.message;
          }
        } catch {
          // ignore JSON parse issues when building error detail
        }
        // Improve guidance on missing credentials in dev
        if (response.status === 401 && useProxy) {
          errorDetail =
            "Missing or invalid server API key. Set OPENAI_API_KEY in your shell (for Vite dev server) or use a backend.";
        } else if (response.status === 401 && !useProxy) {
          errorDetail =
            "Missing or invalid client API key. Set VITE_OPENAI_API_KEY in .env.local for local testing, or prefer the dev proxy.";
        }
        throw new Error(errorDetail);
      }

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No recipes returned. Please try again.");
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new Error("Could not understand the recipe response. Please try again.");
      }

      // Normalise first
      const normalisedRecipes = normaliseRecipes(parsed);

      // Enforce ingredient constraints client-side as a backstop
      const normalizeName = (s) =>
        (s || "")
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, " ")
          .trim();

      const userAllowed = new Set(ingredients.map((i) => normalizeName(i)));
      const stapleKeywords = isAlcoholic
        ? ["ice", "citrus", "lemon", "lime", "orange", "sugar", "simple syrup", "garnish", "twist", "wedge", "slice", "mint", "salt"]
        : ["ice", "citrus", "lemon", "lime", "orange", "sugar", "simple syrup", "soda water", "club soda", "sparkling water", "garnish", "twist", "wedge", "slice", "mint", "salt"];

      const isStaple = (name) => {
        const n = normalizeName(name);
        return stapleKeywords.some((kw) => n.includes(kw));
      };

      const constrained = normalisedRecipes.filter((r) => {
        if (!Array.isArray(r.ingredients) || r.ingredients.length === 0) return false;
        return r.ingredients.every((ing) => {
          const n = normalizeName(ing);
          return userAllowed.has(n) || isStaple(n);
        });
      });

      const limited = constrained.slice(0, 5);

      if (limited.length === 0) {
        throw new Error(
          "No recipes matched your ingredient constraints. Try different ingredients."
        );
      }

      setRecipes(limited);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message || "Unexpected error while generating recipes."
          : "Unexpected error while generating recipes.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setErrorMessage("");

  return {
    recipes,
    isLoading,
    errorMessage,
    generateRecipes,
    clearError,
  };
};
