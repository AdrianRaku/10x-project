# MyFilms 

[![Project Status: In Development](https://img.shields.io/badge/status-in_development-yellowgreen.svg)](https://shields.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

MyFilms is a web application designed for cinema enthusiasts who struggle to find new and interesting movies and TV shows. The application provides personalized, AI-generated recommendations based on individual user ratings and preferences.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

As a movie lover, it can be challenging to discover new content that aligns with your unique tastes. MyFilms solves this by offering a platform where you can:

- Search for movies via The Movie Database (TMDb).
- Rate movies on a scale of 1-10.
- Create personal lists such as "Watch Later" and "Favorites".
- Receive personalized AI-driven recommendations after rating at least 10 movies.

This streamlines the discovery process and enhances the viewing experience.

## Tech Stack

The project is built with a modern and robust technology stack:

- **Frontend:**
  - [Astro 5](https://astro.build/)
  - [React 19](https://react.dev/)
  - [TypeScript 5](https://www.typescriptlang.org/)
  - [Tailwind CSS 4](https://tailwindcss.com/)
  - [Shadcn/ui](https://ui.shadcn.com/)
- **Backend & Database:**
  - [Supabase](https://supabase.com/)
- **AI Integration:**
  - [OpenRouter.ai](https://openrouter.ai/)
- **Testing:**
  - [Vitest](https://vitest.dev/) - Unit & Integration Testing
  - [Playwright](https://playwright.dev/) - E2E Testing
- **CI/CD & Hosting:**
  - [GitHub Actions](https://github.com/features/actions)
  - [DigitalOcean](https://www.digitalocean.com/)

## Getting Started Locally

To set up and run the project on your local machine, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/myfilms.git
    cd myfilms
    ```

2.  **Set up the Node.js version:**
    The project requires Node.js version `22.14.0`. We recommend using a version manager like `nvm`.

    ```bash
    nvm use
    ```

3.  **Install dependencies:**

    ```bash
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:

    ```bash
    cp .env.example .env
    ```

    Then, fill in the required API keys and credentials in the `.env` file.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

The following scripts are available in the `package.json`:

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally for preview.
- `npm run lint`: Lints the codebase for errors.
- `npm run lint:fix`: Lints the codebase and automatically fixes issues.
- `npm run format`: Formats the code using Prettier.

## Project Scope

### Key Features

- **User Authentication:** Secure user registration and login.
- **Movie Search:** Integration with the TMDb API to search for movies.
- **Rating System:** Users can rate movies on a 1-10 scale.
- **Personal Lists:** Manage "Favorites" and "Watch Later" lists.
- **AI Recommendations:** After rating 10 movies, users can generate 5 personalized recommendations based on their rating history and an optional text prompt.

### Out of Scope (for MVP)

- Mobile application.
- Social features like comments or user-to-user interactions.
- Multi-language support.
- Pagination for lists and search results.
- Advanced account management features (e.g., password reset).

## Project Status

This project is currently **in development**. New features and improvements are being actively worked on.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
