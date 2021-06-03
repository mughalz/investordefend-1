# Invest or Defend (Client)

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

An educational game designed to teach the principles and value of quantitative
IT security risk calculation.

This repo. contains the Web client; the server application is available
[here][server-repo].

## Table of Contents

* [Tech Stack](#tech-stack)
* [Features](#features)
* [Installation](#installation)
* [Usage](#usage)
* [Tests](#testing)
* [Documentation](#documentation)
* [Acknowledgments](#acknowledgements)
* [License](#license)
* [Contact Information](#contact-information)

## Technology Stack

This project is primarily written in [TypeScript][typescript].

| Technology | Description                      | Link       |
|------------|----------------------------------|-----------------|
| Node.js    | JavaScript-based server runtime  | [Link][nodejs]  |
| webpack 4  | JavaScript module bundler        | [Link][webpack] |

## Features

This repo. provides:

* a Web client for interacting with the _Invest or Defend_ server;
* client app. mockups/wireframes; and
* a full suite of automated linting functions to ensure codebase standardisation.

## Installation

1. install Node.js:
    * the project currently targets Node v15;
    * we recommend using [nvm][nvm] to manage multiple Node installations in
      a development environment.
1. clone the repo. to your dev. environment:
    * `git clone git@delta.lancs.ac.uk:secure-digitalisation/invest-or-defend/client.git`
1. enter the new folder (`cd Client`); and
1. install NPM packages (`npm install`).

## Usage

### Development

Run `npm run start:dev` to start in development mode using the [webpack
DevServer][devserver].

### Production

* Run `npm run build` to build the app. for production using [webpack][webpack]:
  * insert the appropriate values for `APP_PATH` and `API_URL` in the command
    defined in `package.json`.

_NB: both the server and the client app. must be hosted on the same domain, or
JWT authentication will break due to its reliance on cookies._

## Tests

When the client is running:

* go to `https://⟨ client ⟩/coverage/lcov-report` to view codebase test coverage.

_NB: there are currently no tests and no coverage figures._

## Documentation

When the client is running:

* go to `https://⟨ client ⟩/docs` to view codebase documentation.

When the server is running:

* go to `https://⟨ server ⟩/docs` to view codebase documentation;
* go to `https://⟨ server ⟩/docs/api` to view API documentation generated using
  [Swagger UI][swaggerui].
  
## Acknowledgements

This game adapts a pre-existing training exercise activity created as part of
the [Secure Digitalisation][secdig] project at Lancaster University.

This game was initially developed by [Ben Goldsworthy][bg] as part of
[KTP № 11598][ktp], with funding provided by [Innovate UK][innovate-uk] &
[Mitigate Cyber][mitigate].

Continued development on this game has been supported by the
[Greater Manchester Cyber Foundry][gmcf].

This game was inspired by Hubbard & Seiersen's book _How to Measure Anything in
Cybersecurity Risk_.

## License

This project is currently released under the [CRAPL][crapl]. It should **NOT**
be used in a production environment in its current state.

## Contact Information

| Name          | Link(s)               |
|---------------|-----------------------|
|Zaffar Mughal  | [Email][zmughal]      |
|Jon Lomas      | [Email][jlomas]       |
|Dr Dan Prince  | [Email][dprince]      |

[server-repo]: https://delta.lancs.ac.uk/secure-digitalisation/invest-or-defend/server
[typescript]: https://www.typescriptlang.org/
[nodejs]: https://nodejs.org/
[devserver]: https://webpack.js.org/configuration/dev-server/
[webpack]: https://webpack.js.org/
[firefox]: https://www.mozilla.org/en-GB/firefox/new/
[ubuntu]: https://ubuntu.com/
[husky]: https://typicode.github.io/husky/#/
[nvm]: https://github.com/nvm-sh/nvm
[esnext]: https://esnext.github.io/esnext/
[prettier]: https://prettier.io/
[eslint]: https://eslint.org/
[bem]: http://getbem.com/
[stylelint]: https://stylelint.io/
[typedoc]: https://typedoc.org/
[swaggerui]: https://swagger.io/tools/swagger-ui/
[secdig]: https://www.lancaster.ac.uk/cybersecurity/secure-digitalisation/#d.en.470966
[ktp]: https://info.ktponline.org.uk/action/details/partnership.aspx?id=11598
[innovate-uk]: https://www.gov.uk/government/organisations/innovate-uk
[mitigate]: http://mitigatecyber.com/
[gmcf]: https://gmcyberfoundry.ac.uk/
[crapl]: https://matt.might.net/articles/crapl/
[bg]: https://bengoldsworthy.net
[zmughal]: mailto:z.mughal1@lancaster.ac.uk
[jlomas]: mailto:j.lomas1@lancaster.ac.uk
[dprince]: mailto:d.prince@lancaster.ac.uk
