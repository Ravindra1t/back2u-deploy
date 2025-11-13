# Back2U - Lost and Found Platform

Back2U is a comprehensive lost and found platform designed to help users report and recover lost items within an organization or community. The application features a modern, responsive interface with real-time notifications and chat functionality.

## Features

### User Authentication
- Secure user registration and login
- Password reset functionality
- Role-based access control (User/Admin)
- JWT-based authentication

### Core Functionality
- **Report Lost Items**: Users can report lost items with detailed descriptions and images
- **Report Found Items**: Users can report found items to help reunite them with owners
- **Browse Listings**: View and search through lost and found items
- **Real-time Chat**: Built-in messaging system for communication between users
- **Admin Dashboard**: Manage users, items, and system settings
- **Activity Tracking**: Keep track of your reported and claimed items

### Technical Features
- Real-time updates using Socket.IO
- Image uploads with Cloudinary integration
- Responsive design with Tailwind CSS
- Secure file uploads
- Form validation

## Tech Stack

### Frontend
- **Framework**: React 19
- **State Management**: React Context API
- **Styling**: Tailwind CSS
- **Icons**: Lucide Icons
- **Routing**: React Router v7
- **Real-time**: Socket.IO Client
- **UI Components**: Custom components with Framer Motion animations

### Backend
- **Runtime**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Real-time**: Socket.IO
- **Security**: bcrypt for password hashing

## Project Structure

```
back3u/
├── backend/               # Backend server
│   ├── models/           # MongoDB models
│   ├── middleware/       # Express middleware
│   └── server.js         # Main server file
├── software/             # Frontend React application
│   ├── public/          # Static files
│   └── src/
│       ├── Components/   # Reusable UI components
│       ├── Pages/        # Page components
│       ├── utils/        # Utility functions
│       └── App.js        # Main App component
└── README.md            # This file
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas or local MongoDB instance
- Cloudinary account (for image storage)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd back3u
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your configuration
   ```

3. **Frontend Setup**
   ```bash
   cd ../software
   npm install
   cp .env.example .env
   # Update .env with your API endpoints
   ```

### Environment Variables

**Backend (.env)**
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend development server**
   ```bash
   cd ../software
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Documentation

The API documentation is available at `/api-docs` when running the development server.

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any questions or feedback, please contact [your-email@example.com](mailto:your-email@example.com)

## Acknowledgements
- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Cloudinary](https://cloudinary.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Socket.IO](https://socket.io/)
