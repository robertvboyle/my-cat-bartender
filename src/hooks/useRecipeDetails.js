import { useState } from "react";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const DEV_PROXY_URL = "/api/openai"; // Vite dev proxy path

export const useRecipeDetails = (apiKey) => {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const generateDetails = async (drinkName, allowedIngredients = [], isAlcoholic = true) => {
    const trimmedKey = (apiKey ?? "").trim();
    const useProxy = import.meta.env?.DEV === true;

    if (!drinkName || typeof drinkName !== "string") {
      setErrorMessage("No drink selected. Please pick a drink.");
      return;
    }

    const staples = isAlcoholic
      ? "common bar staples like ice, citrus (lemon/lime/orange), sugar/simple syrup, and simple garnishes"
      : "common mocktail staples like ice, citrus (lemon/lime/orange), sugar/simple syrup, soda water/club soda, and simple garnishes";
    const restrictionLine = isAlcoholic
      ? ""
      : " Ensure the recipe is completely free of alcohol, spirits, and liqueurs.";
    const userContent = `Provide a detailed ${isAlcoholic ? "cocktail" : "mocktail"} recipe for the drink named "${drinkName}".

You must only use ingredients from this list plus ${staples}. Do not introduce any other ingredients.
Allowed ingredients: ${Array.isArray(allowedIngredients) ? allowedIngredients.join(", ") : ""}.${restrictionLine}

Return a single JSON object with: name (string), description (1-2 sentences), ingredients (array of strings with quantities), and steps (array of short step-by-step instructions). Shape: {"name":"...","description":"...","ingredients":["..."],"steps":["..."]}.`;

    setIsLoading(true);
    setErrorMessage("");
    setDetails(null);

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
                "You are an expert mixologist. Provide precise, bar-ready recipes with clear quantities and concise steps.",
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
        } catch {}
        if (response.status === 401 && useProxy) {
          errorDetail =
            "Missing or invalid server API key. Set OPENAI_API_KEY for the dev proxy.";
        } else if (response.status === 401 && !useProxy) {
          errorDetail =
            "Missing or invalid client API key. Set VITE_OPENAI_API_KEY or use the dev proxy.";
        }
        throw new Error(errorDetail);
      }

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No details returned. Please try again.");
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new Error("Could not parse the recipe details. Try again.");
      }

      const name = typeof parsed.name === "string" ? parsed.name.trim() : drinkName;
      const description =
        typeof parsed.description === "string" ? parsed.description.trim() : "";
      const recipeIngredients = Array.isArray(parsed.ingredients)
        ? parsed.ingredients.map((i) => (typeof i === "string" ? i.trim() : "")).filter(Boolean)
        : [];
      const steps = Array.isArray(parsed.steps)
        ? parsed.steps.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean)
        : [];

      setDetails({ name, description, ingredients: recipeIngredients, steps });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message || "Unexpected error while generating details."
          : "Unexpected error while generating details.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setErrorMessage("");

  return { details, isLoading, errorMessage, generateDetails, clearError };
};
