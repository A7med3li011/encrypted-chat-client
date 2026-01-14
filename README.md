# Encrypted Chat Client

A secure, modern Next.js frontend for the Encrypted Chat application with end-to-end encryption and BIP39 recovery.

## Features

- **User Authentication**: Register and login with BIP39 12-word recovery passwords
- **QR Code Support**: Generate and scan QR codes for Account IDs and recovery passwords
- **Real-time Messaging**: Send and receive encrypted messages
- **Conversation Management**: Start conversations using Account IDs
- **Profile Management**: Update user information and view recovery credentials
- **Dark Mode**: Full dark mode support
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **API Client**: Axios
- **Icons**: Lucide React
- **QR Codes**: react-qr-code

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Backend server running on port 3003

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=${process.env.NEXT_PUBLIC_API_URL}
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
client/
├── app/                      # Next.js app router pages
│   ├── auth/                # Authentication pages
│   │   ├── login/          # Login page
│   │   └── register/       # Registration page
│   ├── dashboard/          # Main dashboard
│   ├── profile/            # User profile page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page (redirects)
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   ├── chat/              # Chat-related components
│   └── dashboard/         # Dashboard components
├── lib/                   # Utilities and configurations
│   ├── api/              # API service layer
│   ├── store/            # Zustand stores
│   └── utils/            # Utility functions
└── .env.local            # Environment variables
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

ISC
