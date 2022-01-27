# Integration Tests using Cypress

Cypress is a fast, easy and reliable testing for anything that runs in a browser.

Cypress enables you to write all types of tests:

- End-to-end tests
- Integration tests
- Unit tests (although this has been covered by Jest)

## Requirements

You will need [yarn](https://yarnpkg.com/lang/en/). We currently are using latest stable, so use latest unless there are issues.

Install Cypress: `yarn add cypress --dev`

## Run e2e tests

- `cy:run` : run cypress in headless mode
- `cy:open` : open cypress in an interactive test runner
- `cy:clean` : clean cypress test results and node module cache

## Cypress file structure

```
cypress
  ├── fixtures
    └── example.json // used to mock data
  ├── integration
    └── test_name.spec.ts // this is where all your tests will reside
  ├── plugins
    └── index.js // used to load plugins
  ├── screenshots
    └── test.ts > *.png // screenshot of test result
  ├──support
    └── commands.js // create various custom commands and overwrite existing commands
    └── index.js // place to put global configuration and behavior that modifies Cypress
```

## Cypress Tests Best Practices

Notes about best practices on writing Cypress tests.

## A Cypress Test

Here is a basic Cypress test for VFE

```ts
describe('Upload Page', () => {
  it('shows a upload form', () => {
    cy.visit(`${Cypress.env('host')}/upload`);
    cy.get('[data-testid=upload-form]');
  });
});
```

(we remember to add a data testid attribute in Upload container index.tsx `src/containers/UploadContainer/index.tsx`)

## Running Cypress Tests

To run all Cypress tests, on a locally running application:

- run the client `yarn dev`
- in a new pane run Cypress headless `yarn cy:run` or open cypress runner `yarn cy:open`

Run individual tests with the spec flag: `yarn cypress run --spec cypress/integration/example.spec.js`

## More Best Practice Docs

Please feel free to add to these best practices.

Content below from [Cypress best practice docs](https://docs.cypress.io/guides/references/best-practices.html)

[Link to best practice conference talk](https://www.youtube.com/watch?v=5XQOK0v_YRE)\
Brian Mann goes through an example application, how and why to write good tests.

> Please feel free to add re-usable commands to the `support/commands.js` file for re-use across multiple tests

🛑 Don't use the UI to set state
✅ Set state programmatically with `cy.request`

```js
// DON'T DO THIS
Cypress.Commands.add('slowLogin', () => {
  cy.visit('/#/login');
  cy.get('[data-test=email]').type('joe@example.com');
  cy.get('[data-test=password]').type('joe{enter}');
  cy.hash().should('eq', '#/');
});

// Aaaah, much better
Cypress.Commands.add('fastLogin', () => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:3000/api/users/login',
    body: { email: 'joe@example.com', password: 'joe' },
  }).then((resp) => {
    window.localStorage.setItem('jwt', resp.body.token);
  });
});
```

🛑 Don't use brittle selectors that are subject to change (dynamic class names, text content, etc.)\
✅ Use data-\* attributes that are more resilient to styling and code change

| Selector                            | Recommended | Notes                                                           |
| ----------------------------------- | ----------- | --------------------------------------------------------------- |
| cy.get('button').click()            | Never       | Worst - too generic, no context.                                |
| cy.get('.btn.btn-large').click()    | Never       | Bad. Coupled to styling. Highly subject to change.              |
| cy.get('#main').click()             | Sparingly   | Better. But still coupled to styling or JS event listeners.     |
| cy.get('[name=submission]').click() | Sparingly   | Coupled to the name attribute which has HTML semantics.         |
| cy.contains('Submit').click()       | Depends     | Much better. But still coupled to text content that may change. |
| cy.get('[data-cy=submit]').click()  | Always      | Best. Isolated from all changes.                                |

🛑 Coupling multiple tests together.\
✅ Tests should always be able to be run independently from one another and still pass.

```js
// an example of what NOT TO DO
describe('my form', () => {
  it('visits the form', () => {
    cy.visit('/users/new');
  });

  it('requires first name', () => {
    cy.get('#first').type('Johnny');
  });

  it('requires last name', () => {
    cy.get('#last').type('Appleseed');
  });

  it('can submit a valid form', () => {
    cy.get('form').submit();
  });
});
```

```js
// Much better
describe('my form', () => {
  it('can submit a valid form', () => {
    cy.visit('/users/new');
    cy.get('#first').type('Johnny');
    cy.get('#last').type('Appleseed');
    cy.get('form').submit();
  });
});
```

🛑 Acting like you’re writing unit tests.\
✅ Add multiple assertions and don’t worry about it ¯\\\_(ツ)\_/¯

- You will always know (and can visually see) which assertion failed in a large test
- Cypress runs a series of async life cycle events that reset state between tests
- Resetting tests is much slower than adding more assertions

```js
// Bad Test, no donut
describe('my form', () => {
  before(() => {
    cy.visit('/users/new');
    cy.get('#first').type('johnny');
  });

  it('has validation attr', () => {
    cy.get('#first').should('have.attr', 'data-validation', 'required');
  });

  it('has active class', () => {
    cy.get('#first').should('have.class', 'active');
  });

  it('has formatted first name', () => {
    cy.get('#first').should('have.value', 'Johnny'); // capitalized first letter
  });
});
```

```js
// Nice test, extra donut
describe('my form', () => {
  before(() => {
    cy.visit('/users/new');
  });

  it('validates and formats first name', () => {
    cy.get('#first');
      .type('johnny');
      .should('have.attr', 'data-validation', 'required');
      .and('have.class', 'active');
      .and('have.value', 'Johnny');
  });
});
```

🛑 Using after or afterEach hooks to clean up state.\
✅ Clean up state before tests run.

The idea goes like this:

> After each test I want to ensure the database is reset back to 0 records so when the next test runs, it is run with a clean state.

With that in mind you write something like this:

```js
afterEach(() => {
  cy.resetDb();
});
```

The problem: **there is no guarantee that this code will run.**

🛑 Assigning the return values with const, let, or var.\
✅ [Use closures to access and store what Commands yield you](https://docs.cypress.io/guides/core-concepts/variables-and-aliases.html)

Many first time users look at Cypress code and think it runs synchronously.

```js
// DON'T DO THIS. IT DOES NOT WORK
// THE WAY YOU THINK IT DOES.
const a = cy.get('a');

cy.visit('https://example.cypress.io');

// nope, fails
a.first().click();
```

You rarely have to ever use const, let, or var in Cypress. If you’re using them, you will want to do some refactoring.

If you’re familiar with Cypress commands already, but find yourself using const, let, or var then you’re typically trying to do one of two things:

- You’re trying to store and compare values such as text, classes, attributes.
- You’re trying to share values between tests and hooks like before and beforeEach.

[Here is a very good guide for working with variables and aliases](https://docs.cypress.io/guides/core-concepts/variables-and-aliases.html#Return-Values)

# CI/CD SIT test and notifications
You can keep track on [AWS CodePipline](https://...)

Or you can Join the Slack notifications at [#{project}-dev](https://app.slack.com/client/.....)
