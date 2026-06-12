# TODO

- Add `apps/api/scripts/seed.ts` or remove the `api:db:seed` target until a seed workflow exists.
- Replace the `api-e2e` dependency on the long-running `api:serve` target with a dedicated test server command or a documented external-server prerequisite.
- Decide whether public Scalar/OpenAPI docs should stay public in production or be gated by environment/config.

## Important:

- Fix the database accepting one value for role (for users), but the code expects or could handle multiple roles.

## Inconsistencies

- AuthenticatedRequest is defined more than once (e.g., in the auth module and in the moderation module)
