# Docker Manager - Next.js Web Application

This is a Next.js web application that implements the functionality from the Flutter Docker Manager app. It provides a web interface for managing Docker containers with authentication, real-time logs, and container operations.

## Features Implemented

### Authentication
- Google OAuth integration (simplified for demo)
- JWT token-based authentication
- User session management
- Protected routes

### Container Management
- List all Docker containers
- View container details (status, image, ports, creation date)
- Start, stop, and restart containers
- Real-time container logs via WebSocket
- Interactive terminal for executing commands

### User Interface
- Modern, responsive design using Tailwind CSS
- Dark/light theme support
- Mobile-friendly layout
- Clean card-based design

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI primitives
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **State Management**: React Context API

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with auth provider
│   ├── page.tsx           # Home page (redirects to dashboard or login)
│   ├── dashboard/
│   │   └── page.tsx       # Main dashboard with container list
│   ├── login/
│   │   └── page.tsx       # Login page
│   ├── auth/
│   │   └── callback/
│   │       └── page.tsx   # OAuth callback page
│   └── container/
│       └── [id]/
│           └── page.tsx   # Container detail page
├── components/
│   ├── ui/               # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── alert.tsx
│   └── ContainerList.tsx # Main container list component
├── contexts/
│   └── AuthContext.tsx   # Authentication context
├── services/
│   └── apiService.ts     # API service for backend communication
├── types/
│   └── index.ts          # TypeScript type definitions
└── lib/
    └── utils.ts          # Utility functions
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_BASE_URL=https://felicit.at/dockermanager/api
   NEXT_PUBLIC_BASE_WS_URL=wss://felicit.at/dockermanager/api
   GOOGLE_CLIENT_ID=your-google-client-id
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Authentication Flow

1. User clicks "Sign in with Google" on the login page
2. Application simulates OAuth flow (in production, implement proper Google OAuth)
3. JWT token is stored in localStorage
4. User is redirected to the main container list
5. All API requests include the JWT token in the Authorization header

## API Integration

The application communicates with the Docker Manager backend API:

- **Base URL**: `https://felicit.at/dockermanager/api`
- **Authentication**: Bearer token in Authorization header
- **WebSocket**: Real-time logs at `wss://felicit.at/dockermanager/api/logs`

### Available Endpoints

- `GET /containers` - List all containers
- `GET /containers/:id` - Get container details
- `POST /containers/:id/start` - Start a container
- `POST /containers/:id/stop` - Stop a container
- `POST /containers/:id/restart` - Restart a container
- `POST /auth/google-signin` - Google OAuth authentication
- `POST /auth/verify-token` - Verify JWT token

## WebSocket Integration

Real-time container logs are streamed via WebSocket:

- **Connection URL**: `wss://felicit.at/dockermanager/api/logs?containerId={id}&token={jwt}`
- **Message Types**:
  - Log messages from container
  - Command execution results
  - Connection status updates

## Container Operations

Users can perform the following operations on containers:

- **Start**: Start a stopped container
- **Stop**: Stop a running container
- **Restart**: Restart a running container
- **View Logs**: Real-time log streaming
- **Execute Commands**: Interactive terminal commands

## Responsive Design

The application is fully responsive and works on:

- Desktop computers
- Tablets
- Mobile devices

## Future Enhancements

Potential improvements for the application:

1. **Real Google OAuth**: Implement proper Google OAuth 2.0 flow
2. **Settings Page**: Add user preferences and configuration
3. **Container Creation**: Add ability to create new containers
4. **Advanced Filtering**: Filter containers by status, image, etc.
5. **Bulk Operations**: Select multiple containers for batch operations
6. **Container Metrics**: Display CPU, memory, and network usage
7. **Notifications**: Real-time notifications for container events

## Development Notes

- The application uses TypeScript for type safety
- Components are built with reusability in mind
- Error handling is implemented throughout the application
- The UI follows modern design principles
- Code is organized following Next.js best practices

## Deployment

### Docker Deployment (Recommended for Production)

1. **Set up environment variables**:
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

2. **Build and run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```

3. **Or build and run manually**:
   ```bash
   # Build the Docker image
   docker build -t dockermanager-website .

   # Run the container
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_BASE_URL=https://your-domain.com/api \
     -e NEXT_PUBLIC_BASE_WS_URL=wss://your-domain.com/api \
     -e NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id \
     dockermanager-website
   ```

4. **Access the application** at `http://localhost:3000`

### Traditional Deployment

The application can be deployed to Vercel, Netlify, or any other platform that supports Next.js:

```bash
npm run build
npm start
```

Make sure to set the environment variables in your deployment platform.
