const shopMinisConfig = require("@shopify/shop-minis-react/eslint/config");

module.exports = [
  {
    ignores: ["**/supabase/**", "**/node_modules/**", "**/dist/**"]
  },
  ...(Array.isArray(shopMinisConfig) ? shopMinisConfig : [shopMinisConfig])
];
