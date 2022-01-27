// @ts-check
import "@cypress/code-coverage/support";
import "./commands";
import { isMobile } from "./utils";
import addContext from "mochawesome/addContext";

beforeEach(() => {
  // cy.intercept middleware to remove 'if-none-match' headers from all requests
  // to prevent the server from returning cached responses of API requests
  cy.intercept(
    { url: "http://localhost:3001/**", middleware: true },
    (req) => delete req.headers["if-none-match"]
  );

  // Throttle API responses for mobile testing to simulate real world condition
  if (isMobile()) {
    cy.intercept({ url: "http://localhost:3001/**", middleware: true }, (req) => {
      req.on("response", (res) => {
        // Throttle the response to 1 Mbps to simulate a mobile 3G connection
        res.setThrottle(1000);
      });
    });
  }
});

Cypress.on("test:after:run", (test, runnable) => {
  if (test.state === "failed") {
    const screenshot = `${Cypress.config("screenshotsFolder")}/${Cypress.spec.name}/${
      runnable.parent.title
    } -- ${test.title} (failed).png`;
    addContext({ test }, screenshot);
  }
});
