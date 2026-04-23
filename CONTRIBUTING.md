# Contributing to TagCheck

Thank you for your interest in contributing to this project! We welcome contributions from the community.

# Table of Contents

[Code of Conduct](#code-of-conduct)
[Architecture](#architecture)

- [Repository Structure](#repository-structure)
- [Integration with Tauri](#integration-with-tauri)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monorepo Advantages](#monorepo-advantages)
- [Future Considerations](#future-considerations)

[Code Style](#code-style)
[Issue Tracker](#issue-tracker)
[License](#license)
[Contact](#contact)

## Code of Conduct

We expect all contributors to adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md). Please review it before making any contributions.

## Architecture

### Repository Structure

The project is structured into two primary components: the frontend and the backend. The frontend is developed using Angular and is contained within the `ng-frontend` directory. Conversely, the backend, built with NestJS, resides in the `nest-backend` directory. This separation facilitates clear delineation and management of the two core aspects of the application.

### Integration with Tauri

To deliver a standalone desktop experience, the application now runs inside a Tauri shell. The desktop runtime lives in `apps/desktop-tauri`, while `tools/scripts/tauri/prepare-runtime.ts` prepares the Nest backend sidecar and bundled Node runtime used by the desktop build.

The desktop workflow is centered on:

- `pnpm run dev-tauri`: Runs the Angular desktop build and launches the Tauri shell for local development.
- `pnpm run build-tauri`: Builds the desktop app without producing an installer bundle.
- `pnpm run bundle-tauri`: Produces the current Windows NSIS desktop bundle.

### CI/CD Pipeline

GitHub Actions is used to build the Tauri desktop bundle from the `.github/workflows` directory. The current release path targets the Windows NSIS package produced by `desktop-tauri`.

### Monorepo Advantages

Adopting a monorepo structure simplifies dependency management and streamlines development workflows. This cohesive approach enables the team to maintain a unified codebase for both frontend and backend, promoting easier code sharing and modularization.

### Future Considerations

As the project evolves, additional considerations will include enhancing the desktop runtime's security posture, optimizing its performance, and possibly extending its functionality. Monitoring and addressing the specific needs of the target user groups will be pivotal in guiding these enhancements.

## Code Style

Both Angular and NestJS have their own code style guidelines with ESLint and Prettier configurations. Please ensure that your code follows these guidelines before submitting a pull request for better review and merging process.

## Issue Tracker

If you encounter any issues or have suggestions for improvements, please open an issue on the GitHub issues. Be sure to provide as much detail as possible to help us understand and address the problem.

## License

By contributing to this project, you agree that your contributions will be licensed under the [project's license](./LICENSE).

## Contact

If you have any questions or need further assistance, feel free to reach out to the GitHub discussions. We are happy to help you with any questions you may have.

Happy coding!
