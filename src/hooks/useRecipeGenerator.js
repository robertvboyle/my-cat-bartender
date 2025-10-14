import { useState } from "react";

import { normaliseRecipes } from "../utils/normaliseRecipes";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

export const useRecipeGenerator = (apiKey) => {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const generateRecipes = async (ingredients, isAlcoholic = true) => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setErrorMessage("Missing OpenAI API key. Set VITE_OPENAI_API_KEY in .env.local.");
      return;
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      setErrorMessage("Add at least one ingredient before generating recipes.");
      return;
    }

    const drinkLabel = isAlcoholic ? "alcoholic drinks" : "non-alcoholic drinks";
    const recipeLabel = isAlcoholic ? "alcoholic drink" : "non-alcoholic drink";
    const staples = isAlcoholic
      ? "common bar staples like ice, citrus, sugar, and simple garnishes"
      : "common mocktail staples like ice, citrus, sugar, soda water, and simple garnishes";
    const restrictionLine = isAlcoholic
      ? ""
      : " Ensure every recipe is completely free of alcohol, spirits, and liqueurs.";
    const userContent = `Available ingredients: ${ingredients.join(", ")}. The user wants ${drinkLabel}. Suggest up to 5 distinct ${recipeLabel} recipes that a home bartender can make with these ingredients (you may assume access to ${staples}).${restrictionLine} For each recipe provide a JSON object with name, description (1-2 sentences), and instructions (1-3 short steps). Return a single JSON object shaped as {"recipes":[{...}]}.`;

    setIsLoading(true);
    setErrorMessage("");
    setRecipes([]);

    try {
      const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trimmedKey}`,
        },
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

      const normalisedRecipes = normaliseRecipes(parsed).slice(0, 5);

      if (normalisedRecipes.length === 0) {
        throw new Error("No recipes generated. Try different ingredients.");
      }

      setRecipes(normalisedRecipes);
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
