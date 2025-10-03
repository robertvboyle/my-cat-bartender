import { useState } from "react";
import "./App.css";

const ENV_API_KEY = (import.meta.env.VITE_OPENAI_API_KEY ?? "").trim();
const LOADING_GIF_SRC = "/assets/graphics/loading-cat.gif";

const normaliseRecipes = (payload) => {
  if (!payload || !Array.isArray(payload.recipes)) {
    return [];
  }

  return payload.recipes
    .map((recipe) => ({
      name: typeof recipe.name === "string" ? recipe.name.trim() : "",
      description:
        typeof recipe.description === "string" ? recipe.description.trim() : "",
      instructions:
        typeof recipe.instructions === "string"
          ? recipe.instructions.trim()
          : "",
    }))
    .filter((recipe) => recipe.name);
};

function App() {
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const apiKey = ENV_API_KEY;
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAddIngredient = (event) => {
    event.preventDefault();
    const trimmedInput = ingredientInput.trim();
    if (!trimmedInput) {
      return;
    }

    setIngredients((prevIngredients) => [...prevIngredients, trimmedInput]);
    setIngredientInput("");
  };

  const handleRemoveIngredient = (indexToRemove) => {
    setIngredients((prevIngredients) =>
      prevIngredients.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleGenerateRecipes = async () => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setErrorMessage("Missing OpenAI API key. Set VITE_OPENAI_API_KEY in .env.local.");
      return;
    }

    if (ingredients.length === 0) {
      setErrorMessage("Add at least one ingredient before generating recipes.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setRecipes([]);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trimmedKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5-nano",
          //temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are an expert mixologist who suggests cocktail recipes using the ingredients supplied by the user. Keep suggestions concise and bar-ready.",
            },
            {
              role: "user",
              content: `Available ingredients: ${ingredients.join(
                ", "
              )}. Suggest up to 5 distinct alcoholic drink recipes that a home bartender can make with these ingredients (you may assume access to common bar staples like ice, citrus, sugar, and simple garnishes). For each recipe provide a JSON object with name, description (1-2 sentences), and instructions (1-3 short steps). Return a single JSON object shaped as {"recipes":[{...}]}.`,
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
        } catch (_) {
          // swallow parsing error
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
      } catch (parseError) {
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

  if (showWelcome) {
    return (
      <main className="welcome">
        <div className="welcome__card">
          <h1>welcome to my cat bartender!</h1>
          <button type="button" onClick={() => setShowWelcome(false)}>
            enter
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="home">
      <header className="home__header">
        <h1>my cat bartender</h1>
      </header>

      <section className="home__columns">
        <div className="column column--ingredients">
          <h2>ingredients (the drinking kind)</h2>

          <form className="ingredients-form" onSubmit={handleAddIngredient}>
            <label className="sr-only" htmlFor="ingredient-input">
              ingredient name
            </label>
            <div className="ingredients-form__row">
              <input
                id="ingredient-input"
                type="text"
                value={ingredientInput}
                onChange={(event) => setIngredientInput(event.target.value)}
                placeholder="e.g. rum, cola, pineapple juice"
              />
              <button type="submit">add</button>
            </div>
          </form>

          <ul className="ingredients-list">
            {ingredients.length === 0 ? (
              <li className="ingredients-list__placeholder">
                oh no. it's empty :(
              </li>
            ) : (
              ingredients.map((item, index) => (
                <li className="ingredients-list__item" key={`${item}-${index}`}>
                  <button
                    type="button"
                    className="ingredients-list__remove"
                    onClick={() => handleRemoveIngredient(index)}
                    aria-label={`Remove ${item}`}
                  >
                    x
                  </button>
                  <span>{item}</span>
                </li>
              ))
            )}
          </ul>

          <button
            className="generate-button"
            type="button"
            onClick={handleGenerateRecipes}
            disabled={isLoading}
          >
            {isLoading ? "mixing..." : "generate recipe!"}
          </button>
        </div>

        <div className="column column--recipes">
          <h2>recipes</h2>

          <div className="recipes-output">
            {errorMessage && (
              <div className="status status--error">{errorMessage}</div>
            )}

            {isLoading && !errorMessage && (
              <div className="status status--loading">
                <span>shaking up some purr-fect drinks...</span>
                <img
                  src={LOADING_GIF_SRC}
                  alt="Cat bartender shaking a cocktail shaker."
                  className="status__loading-gif"
                />
              </div>
            )}

            {!isLoading && !errorMessage && recipes.length === 0 && (
              <p className="recipes-placeholder">
                ask for a round to see what the cat suggests.
              </p>
            )}

            {recipes.length > 0 && (
              <ol className="recipes-list">
                {recipes.map((recipe, index) => (
                  <li key={`${recipe.name}-${index}`}>
                    <h3>{recipe.name}</h3>
                    {recipe.description && <p>{recipe.description}</p>}
                    {recipe.instructions && (
                      <p className="recipe-instructions">{recipe.instructions}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
