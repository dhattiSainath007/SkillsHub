// The inner module of pdf-parse@1 has the same signature as the root, so
// just re-export the @types/pdf-parse declarations.
declare module "pdf-parse/lib/pdf-parse.js" {
  import pdf from "pdf-parse";
  export default pdf;
}
