# Mecka Clash V31 — Railway

V31 is prepared for Railway deployment without changing the app's existing architecture.

## Variables

Set these in the Railway service environment:

- `DATABASE_URL`
- `CLASH_API_TOKEN`
- `CLASH_CLAN_TAG`

Never commit the Clash token to Git.

## Deploy

1. Put this project in a GitHub repository.
2. In Railway, create a project and deploy the GitHub repository.
3. Add a PostgreSQL service.
4. Set the variables above on the application service.
5. Railway runs `pnpm install --frozen-lockfile`, then `pnpm build`, then `pnpm start`.

## Important

The exact start/build commands are inherited from the project's package scripts. If the repository uses a workspace-specific start command, keep that command as defined in the root package.json rather than replacing the application architecture.

V31 is a deployment-preparation step; it does not invent Clash data and does not put secrets into source files.
