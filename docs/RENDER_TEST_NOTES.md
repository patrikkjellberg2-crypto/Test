# Render test checklist

1. Create the Web Service from the GitHub repository.
2. Add PostgreSQL and connect its `DATABASE_URL` to the Web Service.
3. Add `CLASH_API_TOKEN` and `CLASH_CLAN_TAG`.
4. Deploy.
5. Check `/api/healthz` first. It should return `{"status":"ok"}`.
6. Open the service URL and verify the Mecka Clash dashboard loads.
7. Verify live clan/war data appears.
8. Verify War Planner assignments persist after refresh.
