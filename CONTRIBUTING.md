# Invest or Defend (Client)

This project welcomes contributions!

This document describes everything you need to know about working with this
project.

## Table of Contents

* [Requesting Features and Reporting Bugs](#requesting-feature-and-reporting-bugs)
* [Development](#development)
* [Releasing](#releasing)
* [Translating](#translating)

## Requesting Features/Reporting Bugs

To request a new feature or to report a bug, create an [Issue][new-issue]:

* example templates are provided;
* if you are reporting a bug that has security implications, please see
  the project [security guidelines][security].

## Development

### Version Control

Version control for this project uses [Git][git].

The project repository is hosted on [Delta][delta], a [GitLab][gitlab] instance
hosted by Lancaster University's SCC Systems Team; please contact them via
Microsoft Teams if there is an issue with the site.

#### Branching

This project uses the [GitHub Flow](https://githubflow.github.io/) branching
methodology:

* branch off of `main` to start developing (`git checkout -b <your branch>`);
* ensure that your new branch has a descriptive name (e.g., ‘fix-foo-bug’);
* create a remote copy of your new branch (`git push`);
* create a draft [merge request][new-merge-request] to merge your branch with
  `main`:
  * tag any related or to-close Issues;
  * assign the PR to yourself unless you have a good reason not to.
* when you think you're finished, un-draft your pull request.

#### Committing

This project uses the [Conventional Commits][conventional-commits] format for
commit messages:

* commit message formatting can be automatically enforced by [Commitizen][commitizen];
* please keep individual commits as small and atomic as possible.

### Configuration

Webpack configuration settings are found in `webpack.config.ts`.

TypeScript configuration settings are found in `tsconfig.json`.

### Code formatting

This repo. uses [Husky][husky] to run pre-commit code formatting and linting
on all staged files. This ensures that only style-conformant code can be
committed (although this can be bypassed by passing the `--no-verify` argument
to your `git commit` command).

The individual commands used by Husky can also be called manually:

* Run `npm run format` to run all format commands.
* Run `npm run format:fix` to attempt to automatically fix all formatter warnings
  and errors.

* Run `npm run lint` to run all linting commands.
* Run `npm run lint:fix` to attempt to automatically fix all linter warnings and
  errors.

#### JavaScript/TypeScript

JavaScript/TypeScript code compilation targets the [ESNext][esnext] standard.

* Run `npm run format:js` to format all JS/TS files with [Prettier][prettier].

* Run `npm run lint:js` to lint all JS/TS files with [ESLint][eslint].
* Run `npm run lint:js:fix` to attempt to automatically fix warnings and errors.

Prettier and ESLint configuration settings are found in `package.json`.

#### Stylesheets

Element class names should follow the [Block Element Modifier][bem] (BEM)
format.

* Run `npm run lint:css` to lint all (S)CSS files with [stylelint][stylelint].
* Run `npm run lint:css:fix` to attempt to automatically fix warnings and errors.

Stylelint configuration settings are found in `package.json`.

#### Markdown

* Run `npm run lint:md` to lint all Markdown files with [markdownlint][markdownlint].
* Run `npm run lint:md:fix` to attempt to automatically fix warnings and errors.

markdownlint does not have any configuration settings.

#### HTML

* Run `npm run lint:html` to lint all HTML files with [HTMLHint][htmlhint].
* HTMLHint is not able to automatically fix warnings and errors.

HTMLHint configuration settings are found in `.htmlhintrc`.

#### JSON

* Run `npm run lint:json` to lint all JSON files in root with [JSON Lint][jsonlint].
* Run `npm run lint:json:fix` to attempt to automatically fix warnings and errors.

JSON Lint does not have any configuration settings.

### Testing

This repo. uses [Husky][husky] to run pre-push tests. This is to guarantee that
all code on the remote repo. should be fully-functional, but this step can be
bypassed if necessary by passing the `--no-verify` flag to the `git push` command.

_NB: There are not currently any tests written for the Web client._

#### Manual Testing

Currently, the server has only been manually tested on a desktop computer running
[Ubuntu GNU/Linux][ubuntu] (20.10+) and the [Firefox][firefox] Web browser (87.0+).

#### Automated Testing

TODO

#### Test Coverage

Test coverage is calculated using [nyc][nyc].

nyc configuration settings are found in `package.json`.

#### Testing Commands

| Command          | Result               |
|-------------------------|--------------------------------|
| `npm run test`      | Run full automated test suite. |
| `npm run test:coverage` | Calculate code test coverage.  |

### Documentation

This repo. uses [Husky][husky] to run pre-push documentation generation. This is
to guarantee that all HTML documentation on the remote repo. should be up-to-date,
but this step can be bypassed if necessary by passing the `--no-verify` flag to
the `git push` command.

#### Tooling

HTML documentation of the codebase is generated using [TypeDoc][typedoc].

Typedoc configuration settings are found in `tsconfig.json`.

#### Documenting

The codebase is documented using TypeDoc docblocks. TypeDoc is able to infer
type information automatically from the code, provided it compiles to TypeScript
without error.

#### Documentation Commands

| Command     | Result             |
|----------------|--------------------------------|
| `npm run docs` | Regenerate HTML documentation. |

## Releasing

### Versioning

This project uses [Semantic Versioning][semver] for version numbering.

NB: This project is currently in version 0.0.0, meaning that it is still in
pre-release development. As such, expect random breaking changes and other such
chaos.

## Translating

Translations are welcome!

[new-issue]: https://delta.lancs.ac.uk/secure-digitalisation/client/issues/new
[security]: https://delta.lancs.ac.uk/secure-digitalisation/invest-or-defend/client/blob/main/SECURITY.md
[git]: https://git-scm.com/
[gitlab]: https://about.gitlab.com/
[delta]: https://delta.lancs.ac.uk/
[scc]: https://www.lancaster.ac.uk/scc/
[new-merge-request]: https://delta.lancs.ac.uk/secure-digitalisation/client/merge_requests/new
[conventional-commits]: https://www.conventionalcommits.org
[commitizen]: https://www.npmjs.com/package/commitizen
[firefox]: https://www.mozilla.org/en-GB/firefox/new/
[ubuntu]: https://ubuntu.com/
[nyc]: https://github.com/istanbuljs/nyc
[semver]: https://semver.org/
[husky]: https://typicode.github.io/husky/#/
[esnext]: https://esnext.github.io/esnext/
[prettier]: https://prettier.io/
[markdownlint]: https://github.com/DavidAnson/markdownlint
[htmlhint]: https://htmlhint.com/
[jsonlint]: https://github.com/zaach/jsonlint
[eslint]: https://eslint.org/
[bem]: http://getbem.com/
[stylelint]: https://stylelint.io/
[typedoc]: https://typedoc.org/
