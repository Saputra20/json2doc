const sentenceLabel = (
  input,
  {
    acronyms = ["API", "ID", "URL"],
    exceptions = {}, // { originalKey: "Custom Label" }
  } = {}
) => {
  if (input == null) return "";

  // 1) direct exceptions
  if (exceptions[input]) return exceptions[input];

  // 2) normalize to tokens: split camelCase, snake_case, kebab-case
  //   - split before capital letters
  //   - split on _ and -
  //   - keep numbers attached or separated appropriately
  const tokens = String(input)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // camel → space
    .replace(/([A-Za-z])(\d+)/g, "$1 $2") // word + numbers
    .replace(/(\d+)([A-Za-z])/g, "$1 $2") // numbers + word
    .trim()
    .split(/\s+/);

  if (tokens.length === 0) return "";

  // 3) apply casing:
  //   - first word: Capitalized (unless acronym)
  //   - next words: lowercase (unless acronym)
  const up = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const isAcr = (s) => acronyms.includes(s.toUpperCase());
  const norm = (s) => s.toLowerCase();

  const out = tokens.map((t, i) => {
    if (isAcr(t)) return t.toUpperCase();
    return i === 0 ? up(t) : norm(t);
  });

  return out.join(" ");
};

const resolveRef = (ref, spec) => {
  if (!ref.startsWith("#/")) throw new Error("Only local refs supported");
  const parts = ref.slice(2).split("/");
  return parts.reduce((acc, key) => acc[key], spec);
};

const mappingParameters = (data) => {
  return `${sentenceLabel(data.name)} is ${
    data.required ? "required" : "optional"
  } and of type ${data.schema.type} (example: ?${data.name}=${
    data.schema.example ? data.schema.example : "value"
  })`;
};

const mappingResponses = (data) => {
  const responses = {};
  if (data.type === "object") {
    for (const propertyArray of Object.entries(data.properties)) {
      const [propertyName, propertyDetail] = propertyArray;
      responses[propertyName] = propertyDetail.example;
    }
  }
  return responses;
};

const mappingHeaders = (data) => {
  for (const header of Object.entries(data)) {
    const [propertyName, propertyDetail] = header;
    if (
      [
        "bearerauth",
        "auth",
        "bearer",
        "jwt",
        "token",
        "authorization",
      ].includes(propertyName.toLowerCase())
    ) {
      return `Authorization is required (ex: authorization: Bearer {token})`;
    }
  }
};

const mappingBody = (data) => {
  if (!data) return;
  const body = {};
  if (data.type === "object" || data.type === "array") {
    for (const propertyArray of Object.entries(data.properties)) {
      const [propertyName, propertyDetail] = propertyArray;
      if (propertyDetail.type === "array") {
        body[propertyName] = [mappingBody(propertyDetail.items)];
      } else if (propertyDetail.type === "object") {
        body[propertyName] = mappingBody(propertyDetail.items);
      } else {
        body[propertyName] = propertyDetail.type;
      }
    }
  }
  return body;
};

module.exports = {
  resolveRef,
  mappingParameters,
  mappingResponses,
  mappingHeaders,
  mappingBody,
};
