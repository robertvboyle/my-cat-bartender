const IngredientList = ({ items, onRemove }) => (
  <ul className="ingredients-list">
    {items.length === 0 ? (
      <li className="ingredients-list__placeholder">oh no. it's empty :(</li>
    ) : (
      items.map((item, index) => (
        <li className="ingredients-list__item" key={`${item}-${index}`}>
          <button
            type="button"
            className="ingredients-list__remove"
            onClick={() => onRemove(index)}
            aria-label={`Remove ${item}`}
          >
            x
          </button>
          <span>{item}</span>
        </li>
      ))
    )}
  </ul>
);

export default IngredientList;
