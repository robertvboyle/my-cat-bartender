import IngredientForm from "./IngredientForm";
import IngredientList from "./IngredientList";

const IngredientsPanel = ({
  ingredientInput,
  onIngredientInputChange,
  onAddIngredient,
  ingredients,
  onRemoveIngredient,
  onGenerateRecipes,
  isGenerateDisabled,
  isAlcoholic,
  onAlcoholPreferenceChange,
}) => (
  <div className="column column--ingredients">
    <h2>ingredients (the drinking kind)</h2>

    <div className="ingredients-toggle">
      <span className="ingredients-toggle__label">drink type</span>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={isAlcoholic}
          onChange={(event) => onAlcoholPreferenceChange(event.target.checked)}
          aria-label="Toggle between alcoholic and non-alcoholic drinks"
        />
        <span className="toggle-switch__track">
          <span className="toggle-switch__thumb" />
        </span>
        <span className="toggle-switch__text">
          {isAlcoholic ? "alcoholic" : "non-alcoholic"}
        </span>
      </label>
    </div>

    <IngredientForm
      value={ingredientInput}
      onChange={onIngredientInputChange}
      onSubmit={onAddIngredient}
    />

    <IngredientList items={ingredients} onRemove={onRemoveIngredient} />

    <button
      className="generate-button"
      type="button"
      onClick={onGenerateRecipes}
      disabled={isGenerateDisabled}
    >
      {isGenerateDisabled ? "mixing..." : "generate recipe!"}
    </button>
  </div>
);

export default IngredientsPanel;
