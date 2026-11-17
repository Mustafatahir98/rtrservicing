import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom does not implement scrolling; components may request it after hash navigation.
Element.prototype.scrollIntoView = () => {};
afterEach(cleanup);
