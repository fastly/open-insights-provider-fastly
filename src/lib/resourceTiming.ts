/*eslint guard-for-in:0*/
import { ResourceTimingEntry } from "@openinsights/openinsights";
import compose from "../util/compose";
import camelCaseToSnakeCase from "../util/camelCaseToSnakeCase";

const EXCLUDED_PROPS = ["name", "initiatorType", "entryType"];

function cloneEntry(entry: ResourceTimingEntry): ResourceTimingEntry {
  const result: ResourceTimingEntry = {};
  for (const key in entry) {
    const type = typeof entry[key];
    if (type === "number" || type === "string") {
      result[key] = entry[key];
    }
  }
  return result;
}

function removeEntryProps(
  entry: ResourceTimingEntry,
  props: string[]
): ResourceTimingEntry {
  const result: ResourceTimingEntry = {};
  return Object.keys(entry).reduce((res, key): ResourceTimingEntry => {
    if (props.indexOf(key) < 0) {
      res[key] = entry[key];
    }
    return res;
  }, result);
}

function normalizeEntryKeys(entry: ResourceTimingEntry): ResourceTimingEntry {
  const result: ResourceTimingEntry = {};
  return Object.keys(entry).reduce((res, key): ResourceTimingEntry => {
    const newKey = camelCaseToSnakeCase(key);
    res[newKey] = entry[key];
    return res;
  }, result);
}

function normalizeEntryProps(
  props: string[]
): (entry: ResourceTimingEntry) => ResourceTimingEntry {
  return (entry): ResourceTimingEntry => removeEntryProps(entry, props);
}

const normalizeEntry: (
  entry: ResourceTimingEntry
) => ResourceTimingEntry = compose(
  normalizeEntryKeys,
  normalizeEntryProps(EXCLUDED_PROPS),
  cloneEntry
);

export {
  cloneEntry,
  removeEntryProps,
  normalizeEntryKeys,
  normalizeEntryProps,
  normalizeEntry,
};
