# Third-Party Notices

Proof402 uses open-source runtime dependencies from npm. The full resolved
dependency tree is pinned in `package-lock.json`; package metadata in
`node_modules` contains the upstream license files and notices during local
development.

Direct runtime dependencies:

| Package | Version checked locally | License |
| --- | ---: | --- |
| `@coinbase/x402` | 2.1.0 | Apache-2.0 |
| `@x402/core` | 2.12.0 | Apache-2.0 |
| `@x402/evm` | 2.12.0 | Apache-2.0 |
| `@x402/express` | 2.12.0 | Apache-2.0 |
| `dotenv` | 17.4.2 | BSD-2-Clause |
| `express` | 5.2.1 | MIT |
| `pg` | 8.20.0 | MIT |

Before a public release, re-check dependency licenses after any package update.
