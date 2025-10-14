const IngredientForm = ({ value, onChange, onSubmit }) => (
  <form className="ingredients-form" onSubmit={onSubmit}>
    <label className="sr-only" htmlFor="ingredient-input">
      ingredient name
    </label>
    <div className="ingredients-form__row">
      <input
        id="ingredient-input"
        type="text"
        value={value}
        onChange={onChange}
        placeholder="e.g. rum, cola, pineapple juice"
      />
      <button type="submit">add</button>
    </div>
  </form>
);

export default IngredientForm;
