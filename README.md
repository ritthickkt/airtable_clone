# Airtable Clone

This project is a full-stack web application that replicates the core functionalities of Airtable. It's built using the T3 Stack, providing a robust, type-safe, and scalable foundation. Users can create bases (workspaces), manage tables with various column types, and perform CRUD operations on records, all within a dynamic and responsive interface.

## ✨ Features

*   **Authentication**: Secure user sign-in with NextAuth.js, supporting Google and Discord providers.
*   **Workspace Management**: Create, view, update, and delete "Bases" (workspaces).
*   **Dynamic Data Tables**:
    *   Create and manage multiple tables within each base.
    *   Define custom columns with types like Text, Number, Status, etc.
    *   Perform CRUD operations on records (rows).
*   **High-Performance Grid**:
    *   Efficiently renders large datasets (tested with 100k+ rows) using `@tanstack/react-virtual`.
    *   Smooth scrolling and interaction.
*   **Rich UI/UX**:
    *   Interactive context menus for records and columns.
    *   Drag-and-drop reordering (can be implemented).
    *   Real-time feedback with optimistic UI updates via tRPC.
*   **Data Views & Manipulation**:
    *   Create and switch between different views for a table.
    *   Advanced sorting and filtering capabilities.
    *   Show, hide, and reorder columns.
*   **Type-Safe API**: End-to-end type safety with tRPC, ensuring consistency between the client and server.

## 🛠️ Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & Plain CSS
*   **API**: [tRPC](https://trpc.io/)
*   **ORM**: [Prisma](https://prisma.io)
*   **Database**: PostgreSQL
*   **Authentication**: [NextAuth.js](https://next-auth.js.org/)
*   **Schema Validation**: [Zod](https://zod.dev/)
*   **UI Components**: Custom components built with React.

## 🚀 Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

*   Node.js (v18 or later)
*   npm, yarn, or pnpm
*   Docker (or Podman)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd airtable_clone
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Copy the example environment file and fill in the required values.
    ```sh
    cp .env.example .env
    ```
    You will need to provide your `DATABASE_URL` and credentials for the authentication providers (Google, Discord) in the `.env` file.

4.  **Start the database:**
    Run the provided script to start a PostgreSQL container using Docker.
    ```sh
    ./start-database.sh
    ```

5.  **Apply database migrations:**
    Push the Prisma schema to your new database.
    ```sh
    npx prisma migrate dev
    ```

6.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📂 Project Structure

The project follows the standard T3 Stack structure, with key directories organized as follows:

```
.
├── prisma/               # Prisma schema, migrations
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router: pages, layouts, components
│   ├── env.js            # Environment variable validation (t3-env)
│   ├── server/           # Backend logic
│   │   ├── api/          # tRPC routers and procedures
│   │   ├── auth/         # NextAuth.js configuration
│   │   └── db.ts         # Prisma client instance
│   ├── styles/           # Global and component-specific CSS
│   ├── trpc/             # tRPC client setup and providers
│   └── types/            # Shared TypeScript types and interfaces
└── ...
```

## 🚢 Deployment

The application is configured for easy deployment on platforms like Vercel.

1.  Push your code to a Git repository (GitHub, GitLab, etc.).
2.  Import the project into your Vercel account.
3.  Configure the environment variables in the Vercel project settings.
4.  Deploy! Vercel will automatically build and deploy your application.

For more details, refer to the [T3 Stack deployment guide for Vercel](https://create.t3.gg/en/deployment/vercel).
