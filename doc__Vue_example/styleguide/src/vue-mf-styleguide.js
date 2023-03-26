import "./set-public-path";

import "./global.css"; //работает БЕЗ регистрации где-либо(!, ???)

// You can export Vue components from this file and import them into your microfrontends
export { default as PageHeader } from "./component-library/page-header.vue";

export function GET_AGE() {
  return "33";
}
