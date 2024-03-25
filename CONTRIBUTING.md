# Contributing to TagCheck

Thank you for your interest in contributing to this project! We welcome contributions from the community.

# Table of Contents

[Code of Conduct](#code-of-conduct)
[Architecture](#architecture)

- [Repository Structure](#repository-structure)
- [Integration with Electron](#integration-with-electron)
- [CI/CD Pipeline](#ci/cd-pipeline)
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

### Integration with Electron

To facilitate a uniform user experience across various operating systems, the application will be encapsulated within an Electron shell for distribution. This approach enables the app to function seamlessly on Windows, macOS, and Linux, catering to a diverse user base that includes testers, marketers, and developers who need to verify Google Tags on their websites. By leveraging Electron, the application avoids the necessity for separate server hosting for its frontend and backend, thereby optimizing cost-efficiency.

The Electron configuration is centralized in two key files:

- `main.js`: Serves as the entry point for the Electron app, orchestrating the main process.
- `forge.config.js`: Contains configuration settings for Electron Forge, which aids in packaging and distributing the application.

### CI/CD Pipeline

The project currently lacks a CI/CD pipeline, but establishing one is a forthcoming enhancement to ensure continuous integration and delivery. Utilizing [GitHub Actions](https://github.com/marketplace/actions/electron-builder-action), the project will automate its build and deployment processes. The CI/CD configuration will be delineated in the `.github/workflows` directory, ensuring that the application remains in a consistently deployable state.

### Monorepo Advantages

Adopting a monorepo structure simplifies dependency management and streamlines development workflows. This cohesive approach enables the team to maintain a unified codebase for both frontend and backend, promoting easier code sharing and modularization.

### Future Considerations

As the project evolves, additional considerations will include enhancing the Electron app's security posture, optimizing its performance, and possibly extending its functionality. Monitoring and addressing the specific needs of the target user groups will be pivotal in guiding these enhancements.

## Code Style

Both Angular and NestJS have their own code style guidelines with ESLint and Prettier configurations. Please ensure that your code follows these guidelines before submitting a pull request for better review and merging process.

## Issue Tracker

If you encounter any issues or have suggestions for improvements, please open an issue on the GitHub issues. Be sure to provide as much detail as possible to help us understand and address the problem.

## License

By contributing to this project, you agree that your contributions will be licensed under the [project's license](./LICENSE).

## Contact

If you have any questions or need further assistance, feel free to reach out to the GitHub discussions. We are happy to help you with any questions you may have.

Happy coding!
