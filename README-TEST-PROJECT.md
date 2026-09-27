# Clash IQ – Test Project

This repository is a safe development/test copy of Clash IQ.

## Purpose
Use this repo to test new features, refactors, War Center changes, AI Coach improvements, and database changes before merging them into the main Clash IQ project.

## Important
- Do not commit API keys or passwords.
- Configure environment variables in the deployment platform.
- Keep production and test databases separate.
- Deploy this test project to a separate Render service.

## Suggested flow
1. Create a new GitHub repository.
2. Upload/extract this project into the repository root.
3. Connect the test repository to a separate Render service.
4. Configure test environment variables.
5. Make and test changes here first.
6. Only move verified changes into the production project.
