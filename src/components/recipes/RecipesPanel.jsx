import { LOADING_GIF_SRC } from "../../constants";

const RecipesPanel = ({ recipes, isLoading, errorMessage, onEditIngredients }) => (
  <div className="column column--recipes">
    <h2>recipes</h2>

    <div className="recipes-output">
      {errorMessage && <div className="status status--error">{errorMessage}</div>}

      {isLoading && !errorMessage && (
        <div className="status status--loading">
          <span>shaking up some purr-fect drinks...</span>
          <img
            src={LOADING_GIF_SRC}
            alt="Cat bartender shaking a cocktail shaker."
            //<!-- className="status__loading-gif" -->
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

    {onEditIngredients && (
      <button
        className="generate-button"
        type="button"
        onClick={onEditIngredients}
        disabled={isLoading}
      >
        {isLoading ? "mixing..." : "generate new recipes"}
      </button>
    )}
  </div>
);

export default RecipesPanel;
