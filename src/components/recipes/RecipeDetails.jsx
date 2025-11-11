import { useEffect } from "react";
import { LOADING_GIF_SRC } from "../../constants";
import { useRecipeDetails } from "../../hooks/useRecipeDetails";

const RecipeDetails = ({ apiKey, drinkName, allowedIngredients = [], isAlcoholic = true, onBack }) => {
  const { details, isLoading, errorMessage, generateDetails, clearError } =
    useRecipeDetails(apiKey);

  useEffect(() => {
    if (drinkName) {
      generateDetails(drinkName, allowedIngredients, isAlcoholic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drinkName]);

  return (
    <div className="column column--recipes">
      <h2>recipe</h2>

      <div className="recipes-output">
        {errorMessage && (
          <div className="status status--error">{errorMessage}</div>
        )}

        {isLoading && !errorMessage && (
          <div className="status status--loading">
            <span>fetching detailed recipe...</span>
            <img src={LOADING_GIF_SRC} alt="Cat bartender shaking a cocktail shaker." />
          </div>
        )}

        {!isLoading && !errorMessage && (
          <div className="recipe-details">
            <h3>{details?.name || drinkName}</h3>
            {details?.description && <p>{details.description}</p>}

            {details?.ingredients?.length > 0 && (
              <div>
                <h4>ingredients</h4>
                <ul>
                  {details.ingredients.map((item, idx) => (
                    <li key={`${idx}-${item}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {details?.steps?.length > 0 && (
              <div>
                <h4>instructions</h4>
                <ol>
                  {details.steps.map((step, idx) => (
                    <li key={`${idx}-${step}`}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="generate-button"
          type="button"
          onClick={() => {
            if (errorMessage) clearError();
            generateDetails(drinkName, allowedIngredients, isAlcoholic);
          }}
          disabled={isLoading}
        >
          {isLoading ? "mixing..." : "regenerate recipe"}
        </button>
        <button className="generate-button" type="button" onClick={onBack}>
          back to drinks :3
        </button>
      </div>
    </div>
  );
};

export default RecipeDetails;
