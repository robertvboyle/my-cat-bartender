export const normaliseRecipes = (payload) => {
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
