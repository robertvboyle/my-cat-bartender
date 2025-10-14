import { useState } from "react";
import "./App.css";

import AppHeader from "./components/AppHeader";
import WelcomeScreen from "./components/WelcomeScreen";
import IngredientsPanel from "./components/ingredients/IngredientsPanel";
import RecipesPanel from "./components/recipes/RecipesPanel";
import { OPENAI_API_KEY } from "./constants";
import { useRecipeGenerator } from "./hooks/useRecipeGenerator";

function App() {
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isAlcoholic, setIsAlcoholic] = useState(true);
  const [activePanel, setActivePanel] = useState("ingredients");

  const {
    recipes,
    isLoading,
    errorMessage,
    generateRecipes,
    clearError,
  } = useRecipeGenerator(OPENAI_API_KEY);

  const handleAddIngredient = (event) => {
    event.preventDefault();
    const trimmedInput = ingredientInput.trim();
    if (!trimmedInput) {
      return;
    }

    setIngredients((prevIngredients) => [...prevIngredients, trimmedInput]);
    setIngredientInput("");

    if (errorMessage) {
      clearError();
    }
  };

  const handleRemoveIngredient = (indexToRemove) => {
    setIngredients((prevIngredients) =>
      prevIngredients.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleIngredientInputChange = (event) => {
    setIngredientInput(event.target.value);
  };

  const handleAlcoholPreferenceChange = (nextValue) => {
    setIsAlcoholic(nextValue);
    if (errorMessage) {
      clearError();
    }
  };

  const handleGenerateRecipes = () => {
    generateRecipes(ingredients, isAlcoholic);
    setActivePanel("recipes");
  };

  const handleReturnToIngredients = () => {
    setActivePanel("ingredients");
    if (errorMessage) {
      clearError();
    }
  };

  if (showWelcome) {
    return <WelcomeScreen onEnter={() => setShowWelcome(false)} />;
  }

  return (
    <main className="home">
      <AppHeader />

      <section className="home__columns">
        {activePanel === "ingredients" ? (
          <IngredientsPanel
            ingredientInput={ingredientInput}
            onIngredientInputChange={handleIngredientInputChange}
            onAddIngredient={handleAddIngredient}
            ingredients={ingredients}
            onRemoveIngredient={handleRemoveIngredient}
            onGenerateRecipes={handleGenerateRecipes}
            isGenerateDisabled={isLoading}
            isAlcoholic={isAlcoholic}
            onAlcoholPreferenceChange={handleAlcoholPreferenceChange}
          />
        ) : (
          <RecipesPanel
            recipes={recipes}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onEditIngredients={handleReturnToIngredients}
          />
        )}
      </section>
    </main>
  );
}

export default App;
