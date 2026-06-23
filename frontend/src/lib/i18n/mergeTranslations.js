function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** Deep-merge translation modules (nested keys like `common` are combined). */
export default function mergeTranslations(...modules) {
  return modules.reduce((acc, mod) => deepMerge(acc, mod), {});
}
